from data_module.models import ScrapedPage
from data_module.scraper.audit_rules import audit_scraped_data
from data_module.scraper.seo_scraper import extract_page_data
from data_module.models import ScrapedPage
from data_module.scraper.audit_rules import audit_scraped_data
from data_module.scraper.seo_scraper import extract_page_data, discover_internal_links




def scrape_and_save_page(website, url: str) -> ScrapedPage:
    scraped_data = extract_page_data(url)
    issues, recommendations, seo_score = audit_scraped_data(scraped_data)

    page, _ = ScrapedPage.objects.update_or_create(
        website=website,
        url=url,
        defaults={
            "status_code": scraped_data.get("status_code"),
            "response_time_ms": scraped_data.get("response_time_ms"),
            "title": scraped_data.get("title", ""),
            "title_length": scraped_data.get("title_length", 0),
            "meta_description": scraped_data.get("meta_description", ""),
            "meta_description_length": scraped_data.get("meta_description_length", 0),
            "canonical": scraped_data.get("canonical", ""),
            "robots_meta": scraped_data.get("robots_meta", ""),
            "h1_text": scraped_data.get("h1_text", ""),
            "h1_count": scraped_data.get("h1_count", 0),
            "h2_count": scraped_data.get("h2_count", 0),
            "paragraph_count": scraped_data.get("paragraph_count", 0),
            "word_count": scraped_data.get("word_count", 0),
            "images_count": scraped_data.get("images_count", 0),
            "images_without_alt": scraped_data.get("images_without_alt", 0),
            "internal_links_count": scraped_data.get("internal_links_count", 0),
            "external_links_count": scraped_data.get("external_links_count", 0),
            "seo_score": seo_score,
            "issues": issues,
            "recommendations": recommendations,
            "raw_text_excerpt": scraped_data.get("raw_text_excerpt", ""),
        }
    )

    return page
def scrape_and_save_page(website, url: str) -> ScrapedPage:
    scraped_data = extract_page_data(url)
    issues, recommendations, seo_score = audit_scraped_data(scraped_data)

    page, _ = ScrapedPage.objects.update_or_create(
        website=website,
        url=url,
        defaults={
            "status_code": scraped_data.get("status_code"),
            "response_time_ms": scraped_data.get("response_time_ms"),
            "title": scraped_data.get("title", ""),
            "title_length": scraped_data.get("title_length", 0),
            "meta_description": scraped_data.get("meta_description", ""),
            "meta_description_length": scraped_data.get("meta_description_length", 0),
            "canonical": scraped_data.get("canonical", ""),
            "robots_meta": scraped_data.get("robots_meta", ""),
            "h1_text": scraped_data.get("h1_text", ""),
            "h1_count": scraped_data.get("h1_count", 0),
            "h2_count": scraped_data.get("h2_count", 0),
            "paragraph_count": scraped_data.get("paragraph_count", 0),
            "word_count": scraped_data.get("word_count", 0),
            "images_count": scraped_data.get("images_count", 0),
            "images_without_alt": scraped_data.get("images_without_alt", 0),
            "internal_links_count": scraped_data.get("internal_links_count", 0),
            "external_links_count": scraped_data.get("external_links_count", 0),
            "seo_score": seo_score,
            "issues": issues,
            "recommendations": recommendations,
            "raw_text_excerpt": scraped_data.get("raw_text_excerpt", ""),
        }
    )

    return page


def crawl_and_scrape_website(website, start_url: str, max_pages: int = 10) -> dict:
    urls = discover_internal_links(start_url, max_pages=max_pages)

    results = []
    for url in urls:
        page = scrape_and_save_page(website, url)
        results.append({
            "url": page.url,
            "status_code": page.status_code,
            "title": page.title,
            "seo_score": page.seo_score,
            "issues": page.issues,
            "recommendations": page.recommendations,
        })

    return {
        "start_url": start_url,
        "total_discovered": len(urls),
        "results": results,
    }