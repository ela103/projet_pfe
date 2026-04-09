def audit_scraped_data(data: dict) -> tuple[list, list, int]:
    issues = []
    recommendations = []
    score = 100

    title = data.get("title", "").strip()
    title_length = data.get("title_length", 0)

    meta_description = data.get("meta_description", "").strip()
    meta_description_length = data.get("meta_description_length", 0)

    h1_count = data.get("h1_count", 0)
    word_count = data.get("word_count", 0)
    images_without_alt = data.get("images_without_alt", 0)
    images_count = data.get("images_count", 0)
    canonical = data.get("canonical", "").strip()
    status_code = data.get("status_code")
    internal_links_count = data.get("internal_links_count", 0)
    external_links_count = data.get("external_links_count", 0)

    # 1) HTTP STATUS
    if status_code != 200:
        issues.append(f"Code HTTP non optimal : {status_code}")
        recommendations.append(
            "Vérifier l’accessibilité de la page et corriger les erreurs serveur ou redirections inutiles."
        )
        score -= 25

    # 2) TITLE
    if not title:
        issues.append("Balise title absente.")
        recommendations.append("Ajouter une balise title unique et descriptive.")
        score -= 18
    elif title_length < 30:
        issues.append("Balise title trop courte.")
        recommendations.append("Allonger le title entre 30 et 60 caractères environ.")
        score -= 10
    elif title_length > 60:
        issues.append("Balise title trop longue.")
        recommendations.append("Raccourcir le title pour éviter sa coupure dans les résultats Google.")
        score -= 8

    # 3) META DESCRIPTION
    if not meta_description:
        issues.append("Meta description absente.")
        recommendations.append("Ajouter une meta description claire et attractive.")
        score -= 15
    elif meta_description_length < 70:
        issues.append("Meta description trop courte.")
        recommendations.append(
            "Rédiger une meta description plus informative, idéalement entre 70 et 160 caractères."
        )
        score -= 8
    elif meta_description_length > 160:
        issues.append("Meta description trop longue.")
        recommendations.append("Raccourcir la meta description pour éviter qu’elle soit tronquée.")
        score -= 8

    # 4) H1
    if h1_count == 0:
        issues.append("Aucune balise H1 trouvée.")
        recommendations.append("Ajouter un H1 principal unique qui décrit clairement le sujet de la page.")
        score -= 15
    elif h1_count > 1:
        issues.append("Plusieurs balises H1 détectées.")
        recommendations.append("Conserver un seul H1 principal pour une structure SEO plus claire.")
        score -= 10

    # 5) CONTENT QUALITY
    if word_count < 150:
        issues.append("Contenu textuel très faible.")
        recommendations.append(
            "Ajouter un contenu beaucoup plus riche et pertinent. La page manque fortement de profondeur sémantique."
        )
        score -= 25
    elif word_count < 300:
        issues.append("Contenu textuel faible.")
        recommendations.append(
            "Enrichir le contenu de la page avec un texte utile, structuré et pertinent."
        )
        score -= 18
    elif word_count < 500:
        issues.append("Contenu textuel moyen.")
        recommendations.append(
            "Ajouter davantage de contenu pertinent pour renforcer la couverture sémantique."
        )
        score -= 8

    # 6) IMAGES ALT
    if images_count > 0 and images_without_alt > 0:
        ratio = images_without_alt / images_count

        if ratio >= 0.7:
            issues.append(f"Beaucoup d’images sans attribut alt ({images_without_alt}/{images_count}).")
            recommendations.append(
                "Ajouter des attributs alt descriptifs à la majorité des images pour l’accessibilité et le SEO."
            )
            score -= 15
        elif ratio >= 0.3:
            issues.append(f"Plusieurs images sans attribut alt ({images_without_alt}/{images_count}).")
            recommendations.append(
                "Compléter les attributs alt manquants sur les images importantes."
            )
            score -= 10
        else:
            issues.append(f"Quelques images sans attribut alt ({images_without_alt}/{images_count}).")
            recommendations.append(
                "Compléter les attributs alt restants pour améliorer l’accessibilité."
            )
            score -= 5

    # 7) CANONICAL
    if not canonical:
        issues.append("Balise canonical absente.")
        recommendations.append("Ajouter une URL canonique pour éviter les problèmes de duplication.")
        score -= 10

    # 8) INTERNAL LINKING
    if internal_links_count == 0:
        issues.append("Aucun lien interne détecté.")
        recommendations.append("Ajouter des liens internes vers d’autres pages stratégiques du site.")
        score -= 12
    elif internal_links_count < 2:
        issues.append("Maillage interne faible.")
        recommendations.append("Ajouter davantage de liens internes pertinents pour améliorer la navigation et le SEO.")
        score -= 6

    # 9) EXTERNAL LINKS (faible poids, juste indicatif)
    if external_links_count == 0:
        # Pas forcément un vrai problème, donc pénalité légère
        issues.append("Aucun lien externe détecté.")
        recommendations.append(
            "Ajouter, si pertinent, quelques références externes fiables pour enrichir le contenu."
        )
        score -= 2

    # 10) NORMALISATION DU SCORE
    score = max(score, 0)

    return issues, recommendations, score