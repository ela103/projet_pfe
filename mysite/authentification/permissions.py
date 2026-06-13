def is_staff_user(request):
    """
    Autorise l'administrateur principal et les admins secondaires.
    """
    return (
        request.user.is_authenticated
        and request.user.is_active
        and request.user.is_staff
    )


def is_main_admin(request):
    """
    Autorise uniquement l'administrateur principal.
    """
    return (
        request.user.is_authenticated
        and request.user.is_active
        and request.user.is_staff
        and request.user.is_superuser
    )