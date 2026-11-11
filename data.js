/**
 * ============================================================================
 * DONNÉES PAR DÉFAUT — PASTORALE ÉTUDIANTE DE LOUVAIN-LA-NEUVE (@pastoralelln)
 * ============================================================================
 * Ce fichier contient les données initiales du site (Agenda de la semaine,
 * Événements, Albums Photos, Kots chrétiens, Équipe "La Pastèque" & CPE).
 *
 * NOTE POUR LE COMKOT & FUTURS MAINTENEURS :
 * - Toutes ces données sont modifiables directement depuis l'interface
 *   "Espace ComKot" sur le site (icône cadenas en haut/bas de page).
 * - Si un cloud Supabase est connecté dans l'Espace ComKot, les modifications
 *   sont synchronisées en temps réel pour tous les visiteurs.
 * ============================================================================
 */

window.PASTO_DEFAULT_DATA = {
  // Configuration de la Messe des Étudiants & Bannière d'annonce
  spotlight: {
    bannerPill: "Mercredi 18h30",
    bannerText: "Messe des Étudiants chaque mercredi à 18h30 à l'Église Saint-François (suivie d'un verre convivial) !",
    wednesdayTime: "Mercredi à 18h30",
    wednesdayPreparedBy: "Le Calleg (Collège Albert le Grand)",
    wednesdayTheme: "Messe animée par la chorale étudiante & suivie d'un verre de l'amitié",
    wednesdayLocation: "Église Saint-François d'Assise (Av. J.-L. Hennebel 30B, face au Martin's Agora)",
    sundayNote: "Aussi le dimanche à 20h00 chez les Dominicains (+ souper étudiant)"
  },

  // L'Agenda de la Semaine (comme sur les posts Instagram @pastoralelln)
  weeklyAgenda: [
    {
      id: "day-lundi",
      day: "Lundi",
      time: "18h00 & 18h30",
      title: "Adoration & Messe paroissiale",
      description: "Temps d'adoration silencieuse et confessions dès 18h00, suivi de la messe à 18h30.",
      place: "Église Saint-François",
      highlight: false
    },
    {
      id: "day-mardi",
      day: "Mardi",
      time: "20h00 – 21h45",
      title: "Soirée « The Chosen » & Partage",
      description: "Projection d'un épisode de la série The Chosen, suivie d'un temps d'échange fraternel et tisane.",
      place: "Kot Carrefour (LLN)",
      highlight: false
    },
    {
      id: "day-mercredi",
      day: "Mercredi",
      time: "18h30",
      title: "Messe des Étudiants",
      description: "Le grand rendez-vous hebdomadaire de la Pasto ! Chorale étudiante, liturgie préparée par un kot et verre convivial après la messe.",
      place: "Église Saint-François",
      highlight: true
    },
    {
      id: "day-jeudi",
      day: "Jeudi",
      time: "19h45 – 21h30",
      title: "P.A.F. & Groupes de prière",
      description: "Parcours d'Approfondissement de la Foi, louange, topo et partage en petits groupes d'étudiants.",
      place: "Kot Carrefour / Foyer St-Paul",
      highlight: false
    },
    {
      id: "day-weekend",
      day: "Dimanche",
      time: "20h00",
      title: "Messe étudiante du dimanche soir",
      description: "Pour ceux qui rentrent au kot le dimanche soir : messe à 20h00 suivie d'un repas étudiant convivial (aussi 9h & 10h30 à St-François).",
      place: "Couvent des Dominicains",
      highlight: false
    }
  ],

  // Parcours "Je veux..." (inspiré de la Paroisse Étudiante de Toulouse)
  pathways: [
    {
      id: "messe-chorale",
      kicker: "Je veux...",
      title: "Venir à la Messe ou chanter dans la Chorale",
      shortDesc: "Découvrir la Messe des Étudiants du mercredi 18h30, rejoindre la chorale, lire ou servir l'autel.",
      icon: "♫",
      modalTitle: "Vivre la Messe des Étudiants & la Chorale",
      modalIntro: "Chaque mercredi de l'année académique à 18h30, des centaines d'étudiants se retrouvent à l'Église Saint-François d'Assise pour célébrer la messe et partager un verre.",
      bullets: [
        "📍 Rendez-vous chaque mercredi à 18h30 à l'Église Saint-François (face à l'hôtel Martin's Agora).",
        "🎶 Chorale & Musiciens : répétition le mercredi dès 17h30 dans l'église avant la messe — chanteurs et instrumentistes de tous niveaux sont les bienvenus !",
        "🕯️ Service de l'autel & Lectures : chaque semaine, un kot ou groupe prépare la liturgie. Tu peux rejoindre l'équipe des servants ou lecteurs en t'adressant à un membre du CPE (foulard rouge).",
        "🍻 Après la messe : on reste ensemble sur le parvis ou au fond de l'église autour d'un verre pour faire connaissance."
      ],
      ctaText: "Voir tous les horaires des messes",
      ctaAction: "agenda"
    },
    {
      id: "approfondir-foi",
      kicker: "Je veux...",
      title: "Approfondir ma foi & rejoindre un groupe",
      shortDesc: "Soirées The Chosen le mardi, parcours P.A.F., groupes de partage biblique, retraites et pèlerinages.",
      icon: "✦",
      modalTitle: "Grandir dans la foi entre étudiants à LLN",
      modalIntro: "Que tu sois croyant de toujours, en plein questionnement ou simplement curieux, la Pastorale Étudiante te propose plusieurs lieux pour échanger et te former :",
      bullets: [
        "🎬 Les Mardis « The Chosen » (20h00 – 21h45 au Kot Carrefour) : regarder ensemble un épisode sur la vie de Jésus et discuter librement autour d'un verre.",
        "🔥 Le P.A.F. (Parcours d'Approfondissement de la Foi) : des soirées thématiques avec un enseignement, un témoignage et un temps de prière pour ancrer sa vie chrétienne.",
        "🙏 Adoration & Prière : tous les soirs de semaine de 18h00 à 18h30 à Saint-François avant la messe (chapelet, vêpres ou adoration silencieuse).",
        "⛰️ Retraites & Week-ends : week-end de rentrée, retraite de Carême, pèlerinages étudiants."
      ],
      ctaText: "Découvrir l'Agenda des activités",
      ctaAction: "agenda"
    },
    {
      id: "sacrements-ecoute",
      kicker: "Je veux...",
      title: "Demander un sacrement ou parler à un prêtre",
      shortDesc: "Baptême adulte, 1re Communion, Confirmation étudiante (Catéchuménat), confession ou écoute.",
      icon: "✝",
      modalTitle: "Sacrements, Catéchuménat & Accompagnement",
      modalIntro: "Il n'y a pas d'âge pour recevoir le Baptême, la Première Communion ou la Confirmation ! Chaque année, plusieurs étudiants de Louvain-la-Neuve cheminent vers les sacrements.",
      bullets: [
        "💧 Catéchuménat étudiant (Baptême, Communion, Confirmation) : un groupe d'étudiants qui se réunit régulièrement avec un prêtre et des accompagnateurs pour découvrir la foi chrétienne à son rythme.",
        "🕊️ Sacrement de Réconciliation (Confession) : permanence des prêtres du lundi au vendredi de 18h00 à 18h25 à l'Église Saint-François, ou sur simple rendez-vous.",
        "☕ Accompagnement spirituel & écoute : besoin de faire le point sur ta vie, ton orientation ou ta foi ? Les prêtres (P. Éric, P. Alexandre) et Marie Beaussant sont disponibles pour te rencontrer."
      ],
      ctaText: "Contacter l'équipe pastorale",
      ctaAction: "contact"
    },
    {
      id: "kot-engagement",
      kicker: "Je veux...",
      title: "Vivre en Kot chrétien ou m'engager",
      shortDesc: "Découvrir les 11 kots et résidences chrétiennes de LLN, les projets solidaires (24h Vélo) et le CPE.",
      icon: "⌂",
      modalTitle: "Kots chrétiens, Solidarité & Engagement étudiant",
      modalIntro: "À Louvain-la-Neuve, la foi se vit aussi au quotidien en colocation et dans le service concret :",
      bullets: [
        "🏠 11 Kots & Résidences à projet chrétien ou spirituel : vie communautaire, soupers de kot, prière commune et projets d'animation sur le campus.",
        "🚲 Solidarité & 24h Vélo : chaque année, la Pastorale Étudiante tient un stand et roule pour une association solidaire (comme l'ASBL Sawa).",
        "🧣 Le CPE (Conseil de la Pastorale Étudiante) & le ComKot : l'équipe d'étudiants au foulard rouge qui coordonne les messes, l'accueil, la communication et les événements."
      ],
      ctaText: "Explorer l'annuaire des Kots",
      ctaAction: "kots"
    }
  ],

  // Prochains événements & Temps forts
  events: [
    {
      id: "evt-messe-mercredi",
      title: "Messe des Étudiants — Préparée par le Calleg",
      date: "2026-10-28",
      time: "18h30 – 20h00",
      category: "Messe",
      location: "Église Saint-François d'Assise",
      description: "Rendez-vous hebdomadaire de toute la communauté étudiante ! Messe chantée par la chorale étudiante, préparée cette semaine par le Collège Albert le Grand (Calleg), suivie d'un verre convivial.",
      image: "assets/post-messe-etudiants.jpg",
      link: "https://www.instagram.com/pastoralelln/",
      featured: true
    },
    {
      id: "evt-the-chosen",
      title: "Soirée « The Chosen » : Projection & Partage",
      date: "2026-10-27",
      time: "20h00 – 21h45",
      category: "Soirée & Foi",
      location: "Kot Carrefour (LLN)",
      description: "On se retrouve au Kot Carrefour pour regarder ensemble le prochain épisode de la série The Chosen, suivi d'un temps d'échange en petits groupes et d'une tisane.",
      image: "assets/post-agenda-semaine.jpg",
      link: "https://www.instagram.com/pastoralelln/",
      featured: true
    },
    {
      id: "evt-24h-velo-sawa",
      title: "Stand de la Pasto aux 24h Vélo — Soutien à l'ASBL Sawa",
      date: "2026-10-25",
      time: "Toute la soirée",
      category: "Solidarité",
      location: "Place des Sciences / Centre de LLN",
      description: "Passe nous voir au stand de la Pastorale Étudiante pendant les 24h Vélo ! Tous les bénéfices soutiennent les projets de solidarité de l'ASBL Sawa.",
      image: "assets/post-24h-velo.jpg",
      link: "https://www.instagram.com/pastoralelln/",
      featured: true
    },
    {
      id: "evt-paf-soiree",
      title: "Soirée P.A.F. — Parcours d'Approfondissement de la Foi",
      date: "2026-11-05",
      time: "19h45 – 21h45",
      category: "Soirée & Foi",
      location: "Église Saint-François / Kot Carrefour",
      description: "Un temps de louange, un topo inspirant pour creuser une grande question de la foi chrétienne, et un temps de prière fraternelle.",
      image: "assets/photo-messe-assemblee.jpg",
      link: "https://www.instagram.com/pastoralelln/",
      featured: false
    },
    {
      id: "evt-dimanche-doms",
      title: "Messe étudiante du dimanche soir & Souper",
      date: "2026-11-01",
      time: "20h00 – 22h00",
      category: "Messe",
      location: "Couvent des Dominicains (LLN)",
      description: "Tu rentres à Louvain-la-Neuve le dimanche soir ? Rejoins la messe étudiante de 20h00 chez les frères Dominicains, suivie d'un repas partagé.",
      image: "assets/photo-messe-autel.jpg",
      link: "https://www.instagram.com/pastoralelln/",
      featured: false
    }
  ],

  // Galerie Photos organisée par Albums (avec vraies photos @pastoralelln)
  photos: [
    {
      id: "ph-1",
      album: "Messe des Étudiants",
      caption: "La chorale étudiante et les membres du CPE au foulard rouge à l'Église Saint-François",
      date: "Octobre 2026",
      src: "assets/cpe-chorale.png"
    },
    {
      id: "ph-2",
      album: "Messe des Étudiants",
      caption: "Assemblée étudiante réunie le mercredi soir à Saint-François",
      date: "Octobre 2026",
      src: "assets/photo-messe-assemblee.jpg"
    },
    {
      id: "ph-3",
      album: "Messe des Étudiants",
      caption: "Procession et liturgie autour de l'autel de Saint-François",
      date: "Octobre 2026",
      src: "assets/photo-messe-autel.jpg"
    },
    {
      id: "ph-4",
      album: "Messe des Étudiants",
      caption: "Consécration et prière eucharistique entourée des servants d'autel",
      date: "Octobre 2026",
      src: "assets/photo-messe-cons.jpg"
    },
    {
      id: "ph-5",
      album: "Messe des Étudiants",
      caption: "Les servants d'autel en prière pendant la messe du mercredi",
      date: "Octobre 2026",
      src: "assets/photo-messe-servants.jpg"
    },
    {
      id: "ph-6",
      album: "Chorale & Fraternité",
      caption: "Répétition et joie des musiciens et choristes avant la célébration",
      date: "Octobre 2026",
      src: "assets/photo-chorale-2.jpg"
    },
    {
      id: "ph-7",
      album: "Chorale & Fraternité",
      caption: "Fraternité étudiante après la messe à l'Église Saint-François",
      date: "Octobre 2026",
      src: "assets/photo-etudiants-groupe.jpg"
    },
    {
      id: "ph-8",
      album: "Chorale & Fraternité",
      caption: "Accueil et animation des chants par les étudiants des kots",
      date: "Octobre 2026",
      src: "assets/photo-chorale-1.jpg"
    },
    {
      id: "ph-9",
      album: "Messe des Étudiants",
      caption: "Proclamation de la Parole de Dieu par les étudiants",
      date: "Octobre 2026",
      src: "assets/photo-messe-lecture-1.jpg"
    },
    {
      id: "ph-10",
      album: "Messe des Étudiants",
      caption: "Lecture et prière universelle préparée par un kot de LLN",
      date: "Octobre 2026",
      src: "assets/photo-messe-lecture-2.jpg"
    },
    {
      id: "ph-11",
      album: "24h Vélo & Solidarité",
      caption: "L'équipe de la Pasto mobilisée au stand des 24h Vélo pour l'ASBL Sawa",
      date: "Octobre 2026",
      src: "assets/photo-24h-stand-1.jpg"
    },
    {
      id: "ph-12",
      album: "24h Vélo & Solidarité",
      caption: "Ambiance et rencontres sur le stand de la Pastorale Étudiante aux 24h Vélo",
      date: "Octobre 2026",
      src: "assets/photo-24h-stand-2.jpg"
    },
    {
      id: "ph-13",
      album: "24h Vélo & Solidarité",
      caption: "Service et convivialité au cœur de la fête étudiante",
      date: "Octobre 2026",
      src: "assets/photo-24h-stand-3.jpg"
    },
    {
      id: "ph-14",
      album: "Vie de la Paroisse",
      caption: "L'Église Saint-François d'Assise au cœur de Louvain-la-Neuve",
      date: "Année académique",
      src: "assets/eglise-st-francois.png"
    }
  ],

  // Annuaire des 11 Kots chrétiens, Résidences & Lieux d'accueil à LLN
  kots: [
    {
      id: "kot-carrefour",
      name: "Kot Carrefour",
      type: "Lieu d'accueil & Kot",
      icon: "🔥",
      description: "Le lieu de rendez-vous chaleureux de la Pastorale Étudiante pour les soirées « The Chosen » du mardi, les réunions d'équipes, les soupers et l'accueil.",
      tags: ["Soirées The Chosen", "Accueil Pasto", "Convivialité"],
      contact: "Via @pastoralelln sur Instagram"
    },
    {
      id: "foyer-saint-paul",
      name: "Foyer Saint-Paul",
      type: "Foyer étudiant",
      icon: "⛪",
      description: "Foyer d'étudiants et d'étudiantes offrant un cadre de vie fraternel, d'étude et de prière au cœur de Louvain-la-Neuve, avec chapelle et activités spirituelles.",
      tags: ["Vie communautaire", "Prière", "Études"],
      contact: "foyersaintpaul.be"
    },
    {
      id: "la-ribambelle",
      name: "La Ribambelle",
      type: "Kot chrétien",
      icon: "🌻",
      description: "Kot communautaire chrétien engagé dans l'animation de la paroisse étudiante, l'accueil et les temps de prière et de fête entre étudiants.",
      tags: ["Vie de kot", "Liturgie", "Fraternité"],
      contact: "Paroisse Saint-François / Pasto LLN"
    },
    {
      id: "calleg",
      name: "Collège Albert le Grand (Calleg)",
      type: "Communauté Dominicaine",
      icon: "🕯️",
      description: "Résidence et communauté étudiante liée au Couvent des Dominicains de LLN : vie fraternelle, réflexion théologique, prière et messe du dimanche soir à 20h.",
      tags: ["Dominicains", "Messe Dimanche 20h", "Réflexion"],
      contact: "dominicainslln.be"
    },
    {
      id: "kot-inigo",
      name: "Kot Inigo",
      type: "Spiritualité Ignatienne",
      icon: "🧭",
      description: "Kot étudiant inspiré par la spiritualité de saint Ignace de Loyola (Jésuites) : relecture de vie, prière communautaire et engagement au service des autres.",
      tags: ["Jésuites", "Prière ignatienne", "Colocation"],
      contact: "Pastorale Étudiante LLN"
    },
    {
      id: "donboskot",
      name: "DonBoskot",
      type: "Spiritualité Salésienne",
      icon: "🤝",
      description: "Kot animé par la joie et la pédagogie de saint Jean Bosco (Salésiens / Salésiennes), tourné vers le service des jeunes, la fête et la prière.",
      tags: ["Don Bosco", "Jeunes", "Joie & Service"],
      contact: "Pastorale Étudiante LLN"
    },
    {
      id: "bio-ethikot",
      name: "Bio-Éthikot",
      type: "Kot à projet / Réflexion",
      icon: "🌱",
      description: "Kot étudiant alliant vie fraternelle et réflexion sur les grandes questions bioéthiques, le respect de la vie, l'écologie intégrale et le sens de l'humain.",
      tags: ["Bioéthique", "Conférences", "Débats"],
      contact: "Pastorale Étudiante LLN"
    },
    {
      id: "kot-saint-damien",
      name: "Kot Saint-Damien",
      type: "Kot chrétien",
      icon: "🕊️",
      description: "Inspiré par le Père Damien et saint François, un kot où se vivent la simplicité, l'accueil de chacun, la prière hebdomadaire et l'entraide étudiante.",
      tags: ["Fraternité", "Prière", "Simplicité"],
      contact: "Pastorale Étudiante LLN"
    },
    {
      id: "maison-saint-pierre",
      name: "Maison Saint-Pierre",
      type: "Maison communautaire",
      icon: "🏠",
      description: "Maison communautaire d'étudiants chrétiens désirant approfondir leur foi, partager une vie de prière régulière et témoigner sur le campus.",
      tags: ["Maison étudiante", "Prière", "Engagement"],
      contact: "Pastorale Étudiante LLN"
    },
    {
      id: "residence-neussart",
      name: "Résidence Neussart",
      type: "Résidence universitaire",
      icon: "📚",
      description: "Résidence universitaire offrant un cadre d'étude studieux, des activités culturelles et une formation humaine et chrétienne (Opus Dei).",
      tags: ["Étude", "Formation", "Vie de famille"],
      contact: "neussart.be"
    },
    {
      id: "residence-bauloy",
      name: "Résidence Bauloy",
      type: "Résidence universitaire",
      icon: "✨",
      description: "Résidence d'étudiantes à deux pas du campus proposant un environnement chaleureux propice à l'étude, au volontariat et à la vie spirituelle.",
      tags: ["Étude", "Volontariat", "Formation"],
      contact: "bauloy.be"
    }
  ],

  // L'Équipe ("La Pastèque" + Le CPE & ComKot)
  team: [
    {
      id: "tm-1",
      name: "Père Éric Mattheeuws",
      role: "Prêtre responsable",
      detail: "Curé de Saint-François & aumônier des étudiants"
    },
    {
      id: "tm-2",
      name: "Père Alexandre Wallemacq",
      role: "Prêtre accompagnateur",
      detail: "Accompagnement spirituel, confessions & sacrements"
    },
    {
      id: "tm-3",
      name: "Marie Beaussant",
      role: "Animatrice pastorale",
      detail: "Coordination de « La Pastèque » & accueil des étudiants"
    },
    {
      id: "tm-4",
      name: "Pierre de Mahieu & Marc Rombouts",
      role: "Équipe « La Pastèque »",
      detail: "Accompagnement pastoral & projets étudiants"
    },
    {
      id: "tm-5",
      name: "Le CPE (Foulards Rouges)",
      role: "Conseil de la Pastorale Étudiante",
      detail: "9 étudiants au service de l'accueil, des messes et de la vie de la Pasto"
    },
    {
      id: "tm-6",
      name: "Le ComKot",
      role: "Équipe Communication",
      detail: "Photos, Instagram @pastoralelln, Agenda de la semaine & Site web"
    }
  ]
};
