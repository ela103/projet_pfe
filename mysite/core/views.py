from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import HttpResponseForbidden

@login_required
def dashboard(request):
    return render(request, "core/dashboard.html")
@login_required
def admin_home(request):
    if getattr(request.user, "role", "") != "ADMIN":
        return HttpResponseForbidden("Accès interdit.")
    return render(request, "core/admin_home.html")