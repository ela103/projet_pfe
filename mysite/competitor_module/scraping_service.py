import time
import requests
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

from .models import ScrapedCompetitorPage


def extract_seo_data(html):
    soup = BeautifulSoup(html, "lxml")

    title = soup.title.string.strip() if soup.title and soup.title.string else None

    meta_tag = soup.find("meta", attrs={"name": "description"})
    meta_description = meta_tag.get("content").strip() if meta_tag and meta_tag.get("content") else None

    h1_tag = soup.find("h1")
    h1 = h1_tag.get_text(strip=True) if h1_tag else None

    h2_tags = soup.find_all("h2")
    h2 = " | ".join([tag.get_text(strip=True) for tag in h2_tags[:10]])

    text = soup.get_text(separator=" ", strip=True)
    word_count = len(text.split())
    raw_text_excerpt = text[:3000]

    return {
        "title": title,
        "meta_description": meta_description,
        "h1": h1,
        "h2": h2,
        "word_count": word_count,
        "raw_text_excerpt": raw_text_excerpt,
    }


def scrape_with_requests(url):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    }

    response = requests.get(url, headers=headers, timeout=20)

    if response.status_code == 403:
        return None

    response.raise_for_status()
    return response.text


def scrape_with_selenium(url):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    try:
        driver.get(url)
        time.sleep(5)
        html = driver.page_source
        return html

    except Exception as e:
        print(f"Erreur Selenium pour {url} : {e}")
        return None

    finally:
        driver.quit()


def scrape_competitor_page(url, competitor):
    html = None

    try:
        html = scrape_with_requests(url)
        if html:
            print(f"BeautifulSoup OK : {url}")
        else:
            print(f"BeautifulSoup bloqué, tentative Selenium : {url}")

    except requests.RequestException as e:
        print(f"Erreur BeautifulSoup pour {url} : {e}")

    if not html:
        html = scrape_with_selenium(url)

    if not html:
        print(f"Échec total du scraping : {url}")
        return None

    data = extract_seo_data(html)

    scraped_page, _ = ScrapedCompetitorPage.objects.update_or_create(
        competitor=competitor,
        url=url,
        defaults=data
    )

    return scraped_page


def scrape_all_serp_results():
    from .models import SerpResult

    results = SerpResult.objects.all()

    scraped = []
    blocked = []

    for result in results:
        page = scrape_competitor_page(
            url=result.url,
            competitor=result.competitor
        )

        if page:
            scraped.append(page)
            print(f"Scrapé : {result.url}")
        else:
            blocked.append(result.url)
            print(f"Bloqué ou erreur : {result.url}")

    return {
        "scraped": scraped,
        "blocked": blocked,
    }