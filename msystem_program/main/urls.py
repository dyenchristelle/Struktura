from django.urls import path
from . import views, views_user
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # path('', views.user_index, name='user_index'),   # homepage
    # path("admin-login/", views.admin_index, name="admin_index"),
    # path('admin-homepage/', views.admin_homepage, name="admin-homepage"),
    # path('admin-products', views.admin_products, name="admin-products"),
    # path('add-product/', views.add_product, name='add_product'),
    # path('user-acc/', views.user_acc, name='user_acc'), # 9-30
    path("", views.admin_login, name="login"),
    path("logout/", views.logout_user, name="logout"),
    path("home_page/", views.home_page, name="home"),
    path('search/', views.search_view, name='search'),
    path("home/add/", views.add_product, name="add_product"),
    path("home/update/<int:product_id>/", views.update_product, name="update_product"),
    path("home/delete/<int:product_id>/", views.delete_product, name="delete_product"),
    path("customers/", views.customers_page, name="customers"),
    path("customers/delete/<int:customer_id>/", views.delete_customer, name="delete_customer"),
    path("category/<str:category>/", views.category_page, name="category"),
    path('category/<str:category>/subcategory/<str:subcategory>/',views.subcategory_page,name='subcategory_page'),
    # user path(s)
    path('home_user/', views_user.home_user, name="home_user"),
    path('products/', views_user.products_page, name="products"),
    path('products/<str:category>/', views_user.products_page, name="products_category"),
    path('about/', views_user.about, name='about'),
    path('account/', views_user.account, name='account'),
    path('faq/', views_user.faq, name='faq'),
    path('contact/', views_user.contact, name='contact'),
    path('help-center/', views_user.help_center, name='help_center'),
    path('privacy/', views_user.privacy, name='privacy'),
    path('return/', views_user.return_page, name='return_page'),
    path('security/', views_user.security, name='security'),
    path('terms/', views_user.terms, name='terms'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)