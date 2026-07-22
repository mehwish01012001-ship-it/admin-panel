import React, { useEffect } from 'react';
import ProductForm from '../ProductForm/ProductForm';
import './AddProduct.css';

const AddProduct = () => {
  useEffect(() => {
    // Dynamic SEO Head Optimization
    document.title = "Add Premium Stitched Product | Designer Studio Portal";
    
    // Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Add new luxury stitched women's wear, bridal couture, pret-a-porter collections, and premium lawn to the catalog.";

    // Meta Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = "designer stitched wear, luxury pret, custom tailored dresses, luxury ladies suits, premium chiffon, bridal collection admin";

    // Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    // Open Graph Tags
    const ogTags = {
      'og:title': 'Add Premium Stitched Product | Designer Studio Portal',
      'og:description': 'Manage, edit, and launch luxury women stitched fashion collections instantly.',
      'og:type': 'website',
      'og:url': window.location.href,
      'og:site_name': 'Luxury Apparel Admin Portal'
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.content = content;
    });

    // Structured Data (Schema.org JSON-LD)
    const schemaId = 'admin-portal-schema';
    let schemaScript = document.getElementById(schemaId);
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = schemaId;
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Add Premium Product - Luxury Apparel Portal",
      "description": "Administrative module to append ready-to-wear stitched women's fashion items to the public catalog.",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Dashboard",
            "item": `${window.location.origin}/dashboard`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Product Management",
            "item": window.location.href
          }
        ]
      }
    });

    return () => {
      // Cleanup dynamically created elements on unmount if navigating elsewhere
      if (schemaScript) schemaScript.remove();
    };
  }, []);

  return (
    <div className="add-product-page">
      <header className="page-header">
        <span className="subtitle-brand">EXQUISITE CRAFTSMANSHIP</span>
        <h1>Product Creation</h1>
        <p>Introduce new masterpieces to your premium women's stitched collection catalog.</p>
      </header>

      <div className="page-content">
        <ProductForm />
      </div>
    </div>
  );
};

export default AddProduct;