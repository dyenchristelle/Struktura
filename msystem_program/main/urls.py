from django.urls import path
from . import views, views_user
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin_login/", views.admin_login, name="login"),
    path("logout_admin/", views.logout_admin, name="logout_admin"),
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
    path('', views_user.home_user, name="home_user"),
    path('products/', views_user.products_page, name="products"),
    path('products/<str:category>/', views_user.products_page, name="products_category"),
    path('products/<str:category>/<str:subcategory>/', views_user.products_page, name="subcategory_page"),
    path('about/', views_user.about, name='about'),
    path('account/', views_user.account, name='account'),
    path('faq/', views_user.faq, name='faq'),
    path('contact/', views_user.contact, name='contact'),
    path('help-center/', views_user.help_center, name='help_center'),
    path('privacy/', views_user.privacy, name='privacy'),
    path('return/', views_user.return_page, name='return_page'),
    path('security/', views_user.security, name='security'),
    path('terms/', views_user.terms, name='terms'),
    path('profile/', views_user.profile, name="profile"),
    path('logout/', views_user.logout_user, name='logout'),
    path('api/save_browsing_history/', views_user.save_browsing_history, name='save_browsing_history'),
    path("recently-viewed/", views_user.get_browsing_history, name="recently_viewed"),
    path('search_results/', views_user.search_products, name="search_products"),
    path('shopping-cart/', views_user.user_cart, name="user_cart"),
    path('update_cart_quantity/', views_user.update_cart_quantity, name='update_cart_quantity'),
    path("checkout/", views_user.checkout, name="checkout"),
    path('buy-now/', views_user.buy_now, name='buy_now'),
    path('add_to_cart/', views_user.add_to_cart, name='add_to_cart'),  
    path('api/get_user_cart/', views_user.get_user_cart, name='get_user_cart'),
    path("remove-from-cart/", views_user.remove_from_cart, name="remove_from_cart"),
    path('orders/', views_user.order_summary, name="order_summary"),


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)