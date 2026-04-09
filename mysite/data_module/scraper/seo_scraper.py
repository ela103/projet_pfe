
import time
from urllib.parse import urlparse, urljoin

import requests
from bs4 import BeautifulSoup
from collections import deque


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def is_internal_link(base_url: str, link: str) -> bool:
    if not link:
        return False

    parsed_base = urlparse(base_url)
    parsed_link = urlparse(link)

    if not parsed_link.netloc:
        return True

    return parsed_link.netloc == parsed_base.netloc


def clean_text(text: str) -> str:
    return " ".join(text.split()) if text else ""


def extract_page_data(url: str) -> dict:
    start = time.time()

    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response_time_ms = int((time.time() - start) * 1000)
        status_code = response.status_code

        if "text/html" not in response.headers.get("Content-Type", ""):
            return {
                "url": url,
                "status_code": status_code,
                "response_time_ms": response_time_ms,
                "title": "",
                "title_length": 0,
                "meta_description": "",
                "meta_description_length": 0,
                "canonical": "",
                "robots_meta": "",
                "h1_text": "",
                "h1_count": 0,
                "h2_count": 0,
                "paragraph_count": 0,
                "word_count": 0,
                "images_count": 0,
                "images_without_alt": 0,
                "internal_links_count": 0,
                "external_links_count": 0,
                "raw_text_excerpt": "",
            }

        soup = BeautifulSoup(response.text, "html.parser")

        title = clean_text(soup.title.get_text()) if soup.title else ""

        meta_description_tag = soup.find("meta", attrs={"name": "description"})
        meta_description = clean_text(meta_description_tag.get("content", "")) if meta_description_tag else ""

        canonical_tag = soup.find("link", attrs={"rel": "canonical"})
        canonical = canonical_tag.get("href", "").strip() if canonical_tag else ""

        robots_tag = soup.find("meta", attrs={"name": "robots"})
        robots_meta = robots_tag.get("content", "").strip() if robots_tag else ""

        h1_tags = soup.find_all("h1")
        h2_tags = soup.find_all("h2")
        p_tags = soup.find_all("p")
        img_tags = soup.find_all("img")
        a_tags = soup.find_all("a", href=True)

        h1_text = clean_text(h1_tags[0].get_text()) if h1_tags else ""

        visible_text = clean_text(soup.get_text(separator=" "))
        words = visible_text.split()

        internal_links_count = 0
        external_links_count = 0

        for a in a_tags:
            href = a.get("href", "").strip()
            if not href or href.startswith("#") or href.startswith("javascript:") or href.startswith("mailto:"):
                continue

            absolute_link = urljoin(url, href)

            if is_internal_link(url, absolute_link):
                internal_links_count += 1
            else:
                external_links_count += 1

        images_without_alt = 0
        for img in img_tags:
            alt = img.get("alt")
            if alt is None or not alt.strip():
                images_without_alt += 1

        return {
            "url": url,
            "status_code": status_code,
            "response_time_ms": response_time_ms,
            "title": title,
            "title_length": len(title),
            "meta_description": meta_description,
            "meta_description_length": len(meta_description),
            "canonical": canonical,
            "robots_meta": robots_meta,
            "h1_text": h1_text,
            "h1_count": len(h1_tags),
            "h2_count": len(h2_tags),
            "paragraph_count": len(p_tags),
            "word_count": len(words),
            "images_count": len(img_tags),
            "images_without_alt": images_without_alt,
            "internal_links_count": internal_links_count,
            "external_links_count": external_links_count,
            "raw_text_excerpt": visible_text[:1000],
        }

    except requests.RequestException as e:
        return {
            "url": url,
            "status_code": None,
            "response_time_ms": None,
            "title": "",
            "title_length": 0,
            "meta_description": "",
            "meta_description_length": 0,
            "canonical": "",
            "robots_meta": "",
            "h1_text": "",
            "h1_count": 0,
            "h2_count": 0,
            "paragraph_count": 0,
            "word_count": 0,
            "images_count": 0,
            "images_without_alt": 0,
            "internal_links_count": 0,
            "external_links_count": 0,
            "raw_text_excerpt": "",
            "error": str(e),
        }
def normalize_url(url: str) -> str:
 return url.rstrip("/")


def discover_internal_links(start_url: str, max_pages: int = 10) -> list[str]:
    visited = set()
    discovered = []
    queue = deque([start_url])

    base_domain = urlparse(start_url).netloc

    while queue and len(discovered) < max_pages:
        current_url = queue.popleft()
        normalized_current = normalize_url(current_url)

        if normalized_current in visited:
            continue

        visited.add(normalized_current)

        try:
            response = requests.get(current_url, headers=HEADERS, timeout=15)
            if response.status_code != 200:
                continue

            content_type = response.headers.get("Content-Type", "")
            if "text/html" not in content_type:
                continue

            discovered.append(current_url)

            soup = BeautifulSoup(response.text, "html.parser")
            links = soup.find_all("a", href=True)

            for link in links:
                href = link.get("href", "").strip()
                if not href:
                    continue

                if href.startswith("#") or href.startswith("mailto:") or href.startswith("javascript:") or href.startswith("tel:"):
                    continue

                absolute_url = urljoin(current_url, href)
                parsed = urlparse(absolute_url)

                clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                normalized_link = normalize_url(clean_url)

                if parsed.netloc != base_domain:
                    continue

                if normalized_link not in visited and normalized_link not in [normalize_url(u) for u in queue]:
                    queue.append(clean_url)

        except requests.RequestException:
            continue

    return discovered