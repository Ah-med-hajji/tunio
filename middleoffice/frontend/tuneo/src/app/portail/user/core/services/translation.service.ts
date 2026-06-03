import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'fr' | 'en';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  fr: {
    // ── Navbar ──────────────────────────────────────────────────────
    nav_home:        'Accueil',
    nav_historique:  'Historique',
    nav_services:    'Services',
    nav_packages:    'Packages',
    nav_pages:       'Pages',
    nav_categories:  'Catégories',
    nav_places:      'Lieux',
    nav_contact:     'Contact',
    nav_login:       'Connexion',
    nav_logout:      'Déconnexion',

    // ── Homepage hero ────────────────────────────────────────────────
    hero_title:    'Profitez de vos vacances avec nous',
    hero_subtitle: 'Trouvez de magnifiques sites en un simple clic',

    // ── Search widget ────────────────────────────────────────────────
    search_region:       'Région',
    search_type_region:  'Tapez ou choisissez...',
    search_delegation:   'Délégation',
    search_date:         'Date',
    search_checkin:      'Arrivée',
    search_checkout:     'Départ',
    search_persons:      'Personnes',
    search_travelers:    'Voyageurs',
    search_btn:          '🔍 Rechercher',
    search_date_pickup:  'Date retrait',
    search_date_return:  'Date retour',
    search_rooms_label:  'Chambres',
    search_adults:       'Adultes',
    search_adults_age:   '18 ans et +',
    search_p_single:     'personne',
    search_p_plural:     'personnes',
    search_r_single:     'chambre',
    search_r_plural:     'chambres',
    search_c_single:     'enfant',
    search_c_plural:     'enfants',

    // ── About ────────────────────────────────────────────────────────
    about_tag:  'à propos de nous',
    about_h1:   'Bienvenue à',
    about_p1:   'Tunéo est une plateforme en ligne dédiée à la découverte des meilleurs sites touristiques. Elle permet aux utilisateurs de rechercher, visualiser et réserver facilement des expériences uniques dans diverses destinations.',
    about_p2:   'Tunéo vous offre une expérience simple et rapide pour planifier vos sorties, découvrir les lieux incontournables et profiter au maximum de votre voyage ou de votre temps libre.',
    about_li1:  'Sites touristiques sélectionnés',
    about_li2:  'Réservation facile',
    about_li3:  'Informations fiables',
    about_li4:  'Plus de 100 destinations et lieux',

    // ── Services section (homepage) ──────────────────────────────────
    svc_tag:    'Services',
    svc_h1:     'Nos Services',
    svc1_h:     'Exploration des sites touristiques',
    svc1_p:     'Découvrez les destinations et les lieux incontournables en Tunisie.',
    svc2_h:     'Recherche de restaurants',
    svc2_p:     'Accédez à une sélection des meilleurs restaurants et spécialités locales.',
    svc3_h:     'Réservation en ligne',
    svc3_p:     'Réservez facilement vos visites touristiques et vos tables.',
    svc4_h:     "Système d'avis",
    svc4_p:     'Consultez les évaluations et partagez votre expérience.',
    svc5_h:     'Planification de visites',
    svc5_p:     'Organisez vos sorties et explorez la Tunisie plus efficacement.',
    svc6_h:     'Plateforme intuitive',
    svc6_p:     'Une interface simple pour accéder rapidement aux informations touristiques.',

    // ── Destinations ─────────────────────────────────────────────────
    dest_tag:   'Destination',
    dest_h1:    'Destination populaire',

    // ── Booking section ──────────────────────────────────────────────
    book_tag:        'Réservation',
    book_h1:         'Réservez Votre Tour',
    book_p1:         'Explorez la Tunisie avec nos circuits exclusifs et flexibles. Choisissez votre destination préférée et réservez facilement en ligne.',
    book_p2:         "De Sidi Bou Saïd aux oasis du Sud, profitez d'expériences uniques et mémorables. Nos packages incluent hébergement, transport et visites guidées.",
    book_more:       'En savoir plus',
    book_form_h1:    'Réservez un Circuit',
    book_name:       'Votre Nom',
    book_email:      'Votre Email',
    book_datetime:   'Date & Heure',
    book_dest:       'Destination',
    book_special:    'Demande spéciale',
    book_btn:        'Réserver',

    // ── Process ──────────────────────────────────────────────────────
    proc_tag:   'Processus',
    proc_h1:    '3 étapes simples pour réserver',
    proc1_h:    'Choisissez votre destination',
    proc1_p:    'Sélectionnez parmi nos destinations tunisiennes : Sidi Bou Saïd, Tozeur, Carthage ou Ain Draham.',
    proc2_h:    'Payez en ligne',
    proc2_p:    'Réglez facilement et en toute sécurité pour valider votre réservation.',
    proc3_h:    'Explorez la Tunisie',
    proc3_p:    'Profitez de votre voyage et vivez des expériences inoubliables en Tunisie.',

    // ── Partners ─────────────────────────────────────────────────────
    part_tag:    'Partenaire de Voyage',
    part_h1:     'Découvrez Nos Partenaires',
    part_hotel:  'Hôtel partenaire',
    part_clinic: 'Clinique partenaire',
    part_rest:   'Restaurant partenaire',

    // ── Footer ───────────────────────────────────────────────────────
    foot_about:   'À propos',
    foot_contact: 'Contact',
    foot_privacy: 'Politique de confidentialité',
    foot_terms:   "Conditions d'utilisation",
    foot_faq:     'FAQs & Aide',
    foot_addr:    '123 Rue, Sousse, Tunisie',
    foot_gallery: 'Galerie',
    foot_copy:    '© 2026 TUNÉO. Tous droits réservés.',
    foot_home:    'Accueil',
    foot_cookies: 'Cookies',
    foot_help:    'Aide',

    // ── Services page ────────────────────────────────────────────────
    sp_h1:        'Nos Services',
    sp_subtitle:  'Découvrez tout ce que TUNÉO met à votre disposition pour un séjour parfait en Tunisie',
    sp_loading:   'Chargement des services...',
    sp_cat_def:   'Explorez les meilleurs lieux de cette catégorie en Tunisie.',
    sp_see:       'Voir les lieux →',
    sp_why_h:     'Pourquoi choisir TUNÉO ?',
    sp_f1_h:      'Recherche facile',
    sp_f1_p:      'Trouvez le lieu idéal par région, catégorie et dates.',
    sp_f2_h:      'Paiement sécurisé',
    sp_f2_p:      'Réservez et payez en ligne via Stripe en toute sécurité.',
    sp_f3_h:      'Facture PDF',
    sp_f3_p:      'Recevez une facture PDF instantanément après réservation.',
    sp_f4_h:      'Assistant IA',
    sp_f4_p:      'Notre chatbot répond à vos questions 24h/7j.',

    // ── Packages page ────────────────────────────────────────────────
    pkg_h1:       'Nos Packages',
    pkg_subtitle: 'Découvrez tous les lieux disponibles en Tunisie — hôtels, restaurants, cafés et bien plus',
    pkg_loading:  'Chargement des packages...',
    pkg_empty:    'Aucun package trouvé pour cette catégorie.',
    pkg_reserve:  'Réserver →',
    pkg_all:      'Tous',
    pkg_single:   'Chambre simple :',
    pkg_double:   'Chambre double :',
    pkg_from:     'À partir de :',
    pkg_per_day:  'DT/j',

    // ── Categories page ──────────────────────────────────────────────
    cat_h1:       'Nos Catégories',
    cat_subtitle: 'Choisissez une catégorie et explorez les meilleurs lieux en Tunisie',
    cat_loading:  'Chargement...',
    cat_def_desc: 'Découvrez les meilleurs endroits de cette catégorie.',
    cat_explore:  'Explorer →',

    // ── Contact page ─────────────────────────────────────────────────
    con_h1:          'Contactez-nous',
    con_subtitle:    "Notre équipe est là pour vous aider. N'hésitez pas à nous écrire.",
    con_coords:      'Nos coordonnées',
    con_addr_title:  'Adresse',
    con_addr_val:    '123 Rue Principale, Sousse, Tunisie',
    con_phone_title: 'Téléphone',
    con_phone_val:   '+216 XX XXX XXX',
    con_email_title: 'Email',
    con_email_val:   'contact@tuneo.tn',
    con_hours_title: 'Horaires',
    con_hours_val:   'Lun – Ven : 08h00 – 18h00',
    con_follow:      'Suivez-nous',
    con_form_h:      'Envoyer un message',
    con_success:     '✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.',
    con_name:        'Nom complet *',
    con_email_f:     'Email *',
    con_subject:     'Sujet',
    con_message:     'Message *',
    con_name_ph:     'Votre nom',
    con_email_ph:    'votre@email.com',
    con_subject_ph:  'Objet de votre message',
    con_msg_ph:      'Écrivez votre message ici...',
    con_send:        'Envoyer le message ✉️',
    con_map:         'Carte Google Maps — Sousse, Tunisie',

    // ── Common ───────────────────────────────────────────────────────
    home_breadcrumb: 'Accueil',
    footer_rights:   '© 2026 TUNÉO. Tous droits réservés.',
  },

  en: {
    // ── Navbar ──────────────────────────────────────────────────────
    nav_home:        'Home',
    nav_historique:  'History',
    nav_services:    'Services',
    nav_packages:    'Packages',
    nav_pages:       'Pages',
    nav_categories:  'Categories',
    nav_places:      'Places',
    nav_contact:     'Contact',
    nav_login:       'Login',
    nav_logout:      'Logout',

    // ── Homepage hero ────────────────────────────────────────────────
    hero_title:    'Enjoy your holidays with us',
    hero_subtitle: 'Find magnificent places with a single click',

    // ── Search widget ────────────────────────────────────────────────
    search_region:       'Region',
    search_type_region:  'Type or choose...',
    search_delegation:   'District',
    search_date:         'Date',
    search_checkin:      'Check-in',
    search_checkout:     'Check-out',
    search_persons:      'Persons',
    search_travelers:    'Travelers',
    search_btn:          '🔍 Search',
    search_date_pickup:  'Pick-up date',
    search_date_return:  'Return date',
    search_rooms_label:  'Rooms',
    search_adults:       'Adults',
    search_adults_age:   '18 years and over',
    search_p_single:     'person',
    search_p_plural:     'persons',
    search_r_single:     'room',
    search_r_plural:     'rooms',
    search_c_single:     'child',
    search_c_plural:     'children',

    // ── About ────────────────────────────────────────────────────────
    about_tag:  'about us',
    about_h1:   'Welcome to',
    about_p1:   'Tunéo is an online platform dedicated to discovering the best tourist sites. It allows users to easily search, view and book unique experiences in various destinations.',
    about_p2:   'Tunéo offers you a simple and fast experience to plan your outings, discover must-see places and make the most of your trip or free time.',
    about_li1:  'Selected tourist sites',
    about_li2:  'Easy booking',
    about_li3:  'Reliable information',
    about_li4:  'Over 100 destinations and places',

    // ── Services section (homepage) ──────────────────────────────────
    svc_tag:    'Services',
    svc_h1:     'Our Services',
    svc1_h:     'Tourist site exploration',
    svc1_p:     'Discover must-see destinations and places in Tunisia.',
    svc2_h:     'Restaurant search',
    svc2_p:     'Access a selection of the best restaurants and local specialties.',
    svc3_h:     'Online booking',
    svc3_p:     'Easily book your tourist visits and table reservations.',
    svc4_h:     'Review system',
    svc4_p:     'Check ratings and share your experience.',
    svc5_h:     'Visit planning',
    svc5_p:     'Organize your outings and explore Tunisia more efficiently.',
    svc6_h:     'Intuitive platform',
    svc6_p:     'A simple interface to quickly access tourist information.',

    // ── Destinations ─────────────────────────────────────────────────
    dest_tag:   'Destination',
    dest_h1:    'Popular destination',

    // ── Booking section ──────────────────────────────────────────────
    book_tag:        'Booking',
    book_h1:         'Book Your Tour',
    book_p1:         'Explore Tunisia with our exclusive and flexible circuits. Choose your preferred destination and book easily online.',
    book_p2:         'From Sidi Bou Saïd to the southern oases, enjoy unique and memorable experiences. Our packages include accommodation, transport and guided tours.',
    book_more:       'Learn more',
    book_form_h1:    'Book a Circuit',
    book_name:       'Your Name',
    book_email:      'Your Email',
    book_datetime:   'Date & Time',
    book_dest:       'Destination',
    book_special:    'Special request',
    book_btn:        'Book Now',

    // ── Process ──────────────────────────────────────────────────────
    proc_tag:   'Process',
    proc_h1:    '3 simple steps to book',
    proc1_h:    'Choose your destination',
    proc1_p:    'Select from our Tunisian destinations: Sidi Bou Saïd, Tozeur, Carthage or Ain Draham.',
    proc2_h:    'Pay online',
    proc2_p:    'Pay easily and securely to confirm your booking.',
    proc3_h:    'Explore Tunisia',
    proc3_p:    'Enjoy your trip and live unforgettable experiences in Tunisia.',

    // ── Partners ─────────────────────────────────────────────────────
    part_tag:    'Travel Partner',
    part_h1:     'Meet Our Partners',
    part_hotel:  'Partner hotel',
    part_clinic: 'Partner clinic',
    part_rest:   'Partner restaurant',

    // ── Footer ───────────────────────────────────────────────────────
    foot_about:   'About',
    foot_contact: 'Contact',
    foot_privacy: 'Privacy policy',
    foot_terms:   'Terms of use',
    foot_faq:     'FAQs & Help',
    foot_addr:    '123 Main Street, Sousse, Tunisia',
    foot_gallery: 'Gallery',
    foot_copy:    '© 2026 TUNÉO. All rights reserved.',
    foot_home:    'Home',
    foot_cookies: 'Cookies',
    foot_help:    'Help',

    // ── Services page ────────────────────────────────────────────────
    sp_h1:        'Our Services',
    sp_subtitle:  'Discover everything TUNÉO offers for a perfect stay in Tunisia',
    sp_loading:   'Loading services...',
    sp_cat_def:   'Explore the best places in this category in Tunisia.',
    sp_see:       'See places →',
    sp_why_h:     'Why choose TUNÉO?',
    sp_f1_h:      'Easy search',
    sp_f1_p:      'Find the ideal place by region, category and dates.',
    sp_f2_h:      'Secure payment',
    sp_f2_p:      'Book and pay online via Stripe securely.',
    sp_f3_h:      'PDF Invoice',
    sp_f3_p:      'Receive a PDF invoice instantly after booking.',
    sp_f4_h:      'AI Assistant',
    sp_f4_p:      'Our chatbot answers your questions 24/7.',

    // ── Packages page ────────────────────────────────────────────────
    pkg_h1:       'Our Packages',
    pkg_subtitle: 'Discover all available places in Tunisia — hotels, restaurants, cafés and more',
    pkg_loading:  'Loading packages...',
    pkg_empty:    'No packages found for this category.',
    pkg_reserve:  'Book →',
    pkg_all:      'All',
    pkg_single:   'Single room:',
    pkg_double:   'Double room:',
    pkg_from:     'From:',
    pkg_per_day:  'DT/day',

    // ── Categories page ──────────────────────────────────────────────
    cat_h1:       'Our Categories',
    cat_subtitle: 'Choose a category and explore the best places in Tunisia',
    cat_loading:  'Loading...',
    cat_def_desc: 'Discover the best places in this category.',
    cat_explore:  'Explore →',

    // ── Contact page ─────────────────────────────────────────────────
    con_h1:          'Contact us',
    con_subtitle:    'Our team is here to help. Feel free to write to us.',
    con_coords:      'Our contact details',
    con_addr_title:  'Address',
    con_addr_val:    '123 Main Street, Sousse, Tunisia',
    con_phone_title: 'Phone',
    con_phone_val:   '+216 XX XXX XXX',
    con_email_title: 'Email',
    con_email_val:   'contact@tuneo.tn',
    con_hours_title: 'Opening hours',
    con_hours_val:   'Mon – Fri: 08:00 – 18:00',
    con_follow:      'Follow us',
    con_form_h:      'Send a message',
    con_success:     '✅ Your message has been sent! We will reply as soon as possible.',
    con_name:        'Full name *',
    con_email_f:     'Email *',
    con_subject:     'Subject',
    con_message:     'Message *',
    con_name_ph:     'Your name',
    con_email_ph:    'your@email.com',
    con_subject_ph:  'Subject of your message',
    con_msg_ph:      'Write your message here...',
    con_send:        'Send message ✉️',
    con_map:         'Google Maps — Sousse, Tunisia',

    // ── Common ───────────────────────────────────────────────────────
    home_breadcrumb: 'Home',
    footer_rights:   '© 2026 TUNÉO. All rights reserved.',
  },
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private _lang = new BehaviorSubject<Lang>(
    (localStorage.getItem('tuneo_lang') as Lang) ?? 'fr'
  );
  readonly lang$ = this._lang.asObservable();

  get lang(): Lang { return this._lang.value; }

  toggle(): void {
    this.setLang(this.lang === 'fr' ? 'en' : 'fr');
  }

  setLang(lang: Lang): void {
    if (this.lang === lang) return;
    localStorage.setItem('tuneo_lang', lang);
    this._lang.next(lang);
  }

  t(key: string): string {
    return TRANSLATIONS[this.lang][key] ?? key;
  }
}
