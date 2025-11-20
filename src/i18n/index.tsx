"use client";

import React, { createContext, useContext, useMemo } from "react";

export type Lang = "en" | "ar";

export function getLocale(lang: Lang): string {
  return lang === "ar" ? "ar-SA" : "en-US";
}

type MessageTree = { [key: string]: string | MessageTree };

const messages: Record<Lang, MessageTree> = {
  en: {
    brand: {
      short: "Energy Hub",
      full: "Energy Hub",
    },
    navigation: {
      home: "Home",
      about: "About",
      events: "Events",
      partners: "Partners",
      joinUs: "Join Us",
      contact: "Contact",
      admin: "Events Dashboard",
    },
    common: {
      loading: "Loading...",
      back: "Back",
      logout: "Logout",
      signIn: "Sign In",
      created: "Created",
    },
    hero: {
      titlePrefix: "KFUPM",
      titleEnergyHub: "Energy Hub",
      tagline:
        "The platform uniting the Energy Clubs and Energy Week. We champion innovation, collaboration, and leadership in energy and sustainability, connecting students, academia, and industry. Rooted in King Fahd University of Petroleum & Minerals, one of the region’s leading institutions in science and technology, the Energy Hub builds on KFUPM’s legacy of excellence to empower students, foster industry partnerships, and drive solutions for a cleaner, more sustainable future.",
      ctaExplore: "Explore Energy Events",
      ctaLearn: "Join Us",
      bgAlt: "Wind turbines and solar panels",
      gifAlt: "Wind turbines animation",
    },
    impact: {
      title: "Impact Numbers",
      stats: {
        attendees: "Attendees",
        workingMembers: "Working Team Members",
        universities: "Universities Collaborated",
        panels: "Discussion Panels",
        majorEvents: "Major Events",
      },
    },
    partners: {
      title: "Partners & Collaborations",
      description:
        "We are proud to collaborate with leading organizations in energy and sustainability. Logos are placeholders for now.",
      logo: "Logo {i}",
    },
    events: {
      title: "Upcoming Events",
      ctaRegister: "Register for Energy Events",
      ctaJoin: "Join Us",
      modal: {
        learnMore: "Learn More",
        close: "Close",
      },
      items: {
        energyWeek: {
          title: "Energy Week (EW)",
          short: "A flagship series uniting students, academia, and industry.",
          content:
            "Energy Week brings together thought leaders and innovators to explore the future of energy through talks, panels, and interactive showcases.",
        },
        sharkTank: {
          title: "Shark Tank – 1st Edition",
          short: "A launchpad for student entrepreneurs in energy innovation.",
          content:
            "The Engineers’ Shark Tank launched as a bold platform for students to pitch their groundbreaking ideas directly to experts and industry leaders.",
        },
        greenH2: {
          title: "Green Hydrogen Workshop",
          short:
            "Deep dive into green hydrogen—technology, demand, and KSA roadmap.",
          content:
            "Hosted with Strategy&, this workshop offered students insights into sustainable energy technologies and potential roadmap for KSA aligned with Vision 2030.",
        },
      },
    },
    footer: {
      brandName: "KFUPM Energy Hub",
      brandDesc:
        "Building on KFUPM’s legacy to empower students, foster industry partnerships, and drive solutions for a cleaner future.",
      quickLinks: "Quick Links",
      contact: "Contact",
      email: "Email",
      phone: "Phone",
      location: "Dhahran, Saudi Arabia",
      rights: "All rights reserved.",
    },
    langSwitcher: {
      ar: "العربية",
      en: "English",
      label: "Language",
    },

    // App pages/components
    nav: {
      logoAlt: "Energy Club Logo",
      events: "Events",
      admin: "Events Dashboard",
      logout: "Logout",
      signIn: "Sign In",
      openMenu: "Open main menu",
      applications: "Applications",
      membership: "Membership",
    },
    login: {
      title: "Energy Hub",
      subtitle: "Sign in to access events and manage your registrations",
      signInTitle: "Sign In",
      signInDesc: "Use your email and password to access the platform",
      emailLabel: "Email",
      passwordLabel: "Password",
      signInButton: "Sign In",
      signUpButton: "Create Account",
      signingIn: "Signing in...",
      loading: "Loading...",
      help: "Need help? Contact the energy Hub administrators.",
      tos: "By signing in, you agree to our terms of service and privacy policy.",
    },
    eventsPage: {
      title: "Upcoming Events ⚡️",
      subtitle: "Discover and register for energy week events",
      loadingEvents: "Loading events...",
      noEventsFound: "No events found",
      noUpcoming: "There are no upcoming events at the moment.",
      viewDetails: "View Details",
      loadMore: "Load More Events",
      loading: "Loading...",
      searchPlaceholder: "Search events by name",
      searchAria: "Search events",
    },
    eventDetails: {
      backToEvents: "Back to Events",
      noImage: "No Image Available",
      organizedBy: "Organized by {name}",
      description: "Description",
      tags: "Tags",
      detailsTitle: "Event Details",
      created: "Created {date}",
      registrationTitle: "Registration",
      pleaseSignIn: "Please sign in to register for this event.",
      signIn: "Sign In",
      alreadyRegistered: "Already Registered",
      youRegisteredOn: "You registered on {date}",
      reasonLabel: "Reason: {reason}",
      eventStatusNotAccepting:
        "This event is {status} and not accepting registrations.",
      eventFull: "Event is Full",
      eventFullSubtitle: "This event has reached its maximum capacity.",
      universityToggle: "Are you from the university?",
      universityEmail: "University Email",
      universityEmailPlaceholder: "Enter your university email",
      whyInterested: "Why are you interested? (Optional)",
      whyPlaceholder: "Tell us why you're interested in attending...",
      registerButton: "Register for Event",
      registering: "Registering...",
      goBack: "Go Back",
    },
    admin: {
      dashboardTitle: "Admin Dashboard",
      manageDesc: "Manage events and view registrations",
      eventsTab: "Events ({count})",
      registrationsTab: 'Registrations for "{title}" ({count})',
      createNewEvent: "Create New Event",
      loadingEvents: "Loading events...",
      noEventsTitle: "No events found",
      noEventsDesc: "Get started by creating your first event.",
      viewRegistrations: "View Registrations",
      delete: "Delete",
      backToEvents: "← Back to Events",
      registrationsFor: 'Registrations for "{title}"',
      registrationsCount: "{count} registration{plural}",
      noRegistrationsTitle: "No registrations found",
      noRegistrationsDesc: "No one has registered for this event yet.",
      attendees: "attendees",
      created: "Created {date}",
      applications: {
        searchPlaceholder: "Search applications by name, email, or KFUPM ID",
        searchAria: "Search applications",
      },
      registrations: {
        searchPlaceholder: "Search registrations by name or email",
        searchAria: "Search registrations",
      },
      // Create event page
      createPage: {
        backToAdmin: "Back to Admin Dashboard",
        pageTitle: "Create New Event",
        subtitle: "Fill in the details below to create a new event",
        infoTitle: "Event Information",
        infoDesc: "Provide the basic information about your event",
        labels: {
          title: "Event Title *",
          description: "Description *",
          dateTime: "Date & Time *",
          location: "Location *",
          maxAttendees: "Maximum Attendees *",
          imageUrl: "Event Image (Optional)",
          tags: "Tags",
          add: "Add",
          cancel: "Cancel",
          creating: "Creating...",
          createEvent: "Create Event",
          placeholders: {
            title: "Enter event title",
            description: "Describe your event",
            location: "Event location",
            imageUrl: "Select an image file",
            tag: "Add a tag and press Enter",
            universityEmail: "Enter your university email",
          },
        },
      },
    },
  },

  ar: {
    brand: {
      short: "مركز الطاقة",
      full: "مركز الطاقة بجامعة الملك فهد للبترول والمعادن",
    },
    navigation: {
      home: "الرئيسية",
      about: "من نحن",
      events: "الفعاليات",
      partners: "الشركاء",
      joinUs: "انضم إلينا",
      contact: "تواصل معنا",
      admin: "لوحة التحكم",
    },
    common: {
      loading: "جارٍ التحميل...",
      back: "رجوع",
      logout: "تسجيل الخروج",
      signIn: "تسجيل الدخول",
      created: "تم الإنشاء",
    },
    hero: {
      titlePrefix: "جامعة الملك فهد",
      titleEnergyHub: "مركز الطاقة",
      tagline:
        " منصة تجمع أندية الطاقة وأسبوع الطاقة. نُعزز الابتكار والتعاون والقيادة في مجالات الطاقة والاستدامة، ونربط بين الطلاب والأكاديميا والصناعة. منبثقًا من جامعة الملك فهد للبترول والمعادن، إحدى المؤسسات الرائدة في المنطقة في مجالات العلوم والتقنية، يبني مركز الطاقة على إرث الجامعة العريق في التميز لتمكين الطلاب، وتعزيز الشراكات مع الصناعة، ودفع الحلول نحو مستقبل أنظف وأكثر استدامة ",
      ctaExplore: "استكشف فعاليات الطاقة",
      ctaLearn: "انضم الينا",
      bgAlt: "توربينات رياح وألواح شمسية",
      gifAlt: "رسوم متحركة لتوربينات الرياح",
    },
    impact: {
      title: "أرقام الأثر",
      stats: {
        attendees: "الحضور",
        workingMembers: "أعضاء الفريق",
        universities: "الجامعات المتعاونة",
        panels: "جلسات النقاش",
        majorEvents: "الفعاليات الكبرى",
      },
    },
    partners: {
      title: "الشركاء والتعاون",
      description:
        "نفخر بالتعاون مع جهات رائدة في مجالات الطاقة والاستدامة. الشعارات حالياً افتراضية.",
      logo: "الشعار {i}",
    },
    events: {
      title: "الفعاليات",
      ctaRegister: "سجّل في الفعاليات",
      ctaJoin: "انضم إلينا",
      modal: {
        learnMore: "اقرأ المزيد",
        close: "إغلاق",
      },
      items: {
        energyWeek: {
          title: "أسبوع الطاقة",
          short: "سلسلة رائدة تجمع الطلاب والأكاديميا والصناعة.",
          content:
            "يجمع أسبوع الطاقة القادة والمبتكرين لاستكشاف مستقبل الطاقة عبر جلسات حوارية وعروض تفاعلية.",
        },
        sharkTank: {
          title: "شرك تانك – النسخة الأولى",
          short: "منصة لإطلاق رواد الأعمال الطلاب في ابتكارات الطاقة.",
          content:
            "أطلق مهندسو شرك تانك منصة جريئة لتمكين الطلاب من عرض أفكارهم أمام الخبراء وقادة الصناعة.",
        },
        greenH2: {
          title: "ورشة الهيدروجين الأخضر",
          short: "تعرف على التقنية والطلب وخارطة الطريق في المملكة.",
          content:
            "بالشراكة مع Strategy&، قدّمت الورشة نظرة معمقة على تقنيات الطاقة المستدامة وخارطة طريق متوافقة مع رؤية 2030.",
        },
      },
    },
    footer: {
      brandName: "مركز الطاقة بجامعة الملك فهد للبترول والمعادن",
      brandDesc:
        "نُعزز إرث الجامعة لتمكين الطلاب وبناء الشراكات الصناعية ودفع الحلول لمستقبل أنظف.",
      quickLinks: "روابط سريعة",
      contact: "تواصل",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      location: "الظهران، المملكة العربية السعودية",
      rights: "جميع الحقوق محفوظة.",
    },
    langSwitcher: {
      ar: "العربية",
      en: "English",
      label: "اللغة",
    },

    // App pages/components
    nav: {
      logoAlt: "شعار نادي الطاقة",
      events: "الفعاليات",
      admin: "لوحة التحكم",
      logout: "تسجيل الخروج",
      signIn: "تسجيل الدخول",
      openMenu: "فتح القائمة الرئيسية",
      applications: "الطلبات",
      membership: "العضوية",
    },
    login: {
      title: "نادي الطاقة",
      subtitle: "سجّل الدخول للوصول إلى الفعاليات وإدارة تسجيلاتك",
      signInTitle: "تسجيل الدخول",
      signInDesc: "استخدم بريدك الإلكتروني وكلمة المرور للوصول إلى المنصة",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      signInButton: "تسجيل الدخول",
      signUpButton: "إنشاء حساب",
      signingIn: "جارٍ تسجيل الدخول...",
      loading: "جارٍ التحميل...",
      help: "تحتاج مساعدة؟ تواصل مع مسؤولي نادي الطاقة.",
      tos: "بتسجيل الدخول، فإنك توافق على شروط الخدمة وسياسة الخصوصية.",
    },
    eventsPage: {
      title: "الفعاليات القادمة ⚡️",
      subtitle: "اكتشف وسجّل في فعاليات اسبوع الطاقة",
      loadingEvents: "جارٍ تحميل الفعاليات...",
      noEventsFound: "لا توجد فعاليات",
      noUpcoming: "لا توجد فعاليات قادمة حالياً.",
      viewDetails: "عرض التفاصيل",
      loadMore: "تحميل المزيد من الفعاليات",
      loading: "جارٍ التحميل...",
      searchPlaceholder: "ابحث في الفعاليات بالاسم",
      searchAria: "بحث في الفعاليات",
    },
    eventDetails: {
      backToEvents: "الرجوع إلى الفعاليات",
      noImage: "لا توجد صورة",
      organizedBy: "ينظمها {name}",
      description: "الوصف",
      tags: "الوسوم",
      detailsTitle: "تفاصيل الفعالية",
      created: "تم الإنشاء بتاريخ {date}",
      registrationTitle: "التسجيل",
      pleaseSignIn: "يرجى تسجيل الدخول للتسجيل في هذه الفعالية.",
      signIn: "تسجيل الدخول",
      alreadyRegistered: "تم التسجيل مسبقاً",
      youRegisteredOn: "قمت بالتسجيل بتاريخ {date}",
      reasonLabel: "السبب: {reason}",
      eventStatusNotAccepting: "هذه الفعالية {status} ولا تقبل التسجيل.",
      eventFull: "الفعالية ممتلئة",
      eventFullSubtitle: "وصلت الفعالية إلى الحد الأقصى من السعة.",
      universityToggle: "هل أنت من الجامعة؟",
      universityEmail: "البريد الجامعي",
      universityEmailPlaceholder: "أدخل بريدك الجامعي",
      whyInterested: "لماذا أنت مهتم؟ (اختياري)",
      whyPlaceholder: "أخبرنا لماذا ترغب في الحضور...",
      registerButton: "سجّل في الفعالية",
      registering: "جارٍ التسجيل...",
      goBack: "رجوع",
    },
    admin: {
      dashboardTitle: "لوحة التحكم",
      manageDesc: "إدارة الفعاليات وعرض التسجيلات",
      eventsTab: "الفعاليات ({count})",
      registrationsTab: 'التسجيلات لفعالية "{title}" ({count})',
      createNewEvent: "إنشاء فعالية جديدة",
      loadingEvents: "جارٍ تحميل الفعاليات...",
      noEventsTitle: "لا توجد فعاليات",
      noEventsDesc: "ابدأ بإنشاء أول فعالية لك.",
      viewRegistrations: "عرض التسجيلات",
      delete: "حذف",
      backToEvents: "← الرجوع إلى الفعاليات",
      registrationsFor: 'التسجيلات لفعالية "{title}"',
      registrationsCount: "{count} تسجيل{plural}",
      noRegistrationsTitle: "لا توجد تسجيلات",
      noRegistrationsDesc: "لم يقم أحد بالتسجيل في هذه الفعالية بعد.",
      attendees: "حاضر",
      created: "تم الإنشاء بتاريخ {date}",
      applications: {
        searchPlaceholder: "ابحث في الطلبات بالاسم أو البريد أو رقم الجامعة",
        searchAria: "بحث في الطلبات",
      },
      registrations: {
        searchPlaceholder: "ابحث في التسجيلات بالاسم أو البريد",
        searchAria: "بحث في التسجيلات",
      },
      createPage: {
        backToAdmin: "الرجوع إلى لوحة التحكم",
        pageTitle: "إنشاء فعالية جديدة",
        subtitle: "املأ التفاصيل أدناه لإنشاء فعالية جديدة",
        infoTitle: "معلومات الفعالية",
        infoDesc: "أدخل المعلومات الأساسية عن فعاليتك",
        labels: {
          title: "عنوان الفعالية *",
          description: "الوصف *",
          dateTime: "التاريخ والوقت *",
          location: "الموقع *",
          maxAttendees: "الحد الأقصى للحضور *",
          imageUrl: "صورة الفعالية (اختياري)",
          tags: "الوسوم",
          add: "إضافة",
          cancel: "إلغاء",
          creating: "جارٍ الإنشاء...",
          createEvent: "إنشاء الفعالية",
          placeholders: {
            title: "أدخل عنوان الفعالية",
            description: "اكتب وصف الفعالية",
            location: "موقع الفعالية",
            imageUrl: "اختر ملف صورة",
            tag: "أضف وسمًا واضغط Enter",
            universityEmail: "أدخل بريدك الجامعي",
          },
        },
      },
    },
  },
};

function getByPath(
  obj: MessageTree,
  path: string
): string | MessageTree | undefined {
  let current: unknown = obj;
  for (const key of path.split(".")) {
    if (
      typeof current === "object" &&
      current !== null &&
      key in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current as string | MessageTree | undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return Object.keys(params).reduce(
    (acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(params[k])),
    template
  );
}

type I18nContextValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  dir: "ltr",
  t: (key: string) => key,
});

export function getDirFromLang(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const dict = messages[lang] || messages.en;
    return {
      lang,
      dir: getDirFromLang(lang),
      t: (key: string, params?: Record<string, string | number>) => {
        const v = getByPath(dict, key);
        if (typeof v === "string") return interpolate(v, params);
        return key;
      },
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function getMessagesFor(lang: Lang) {
  return messages[lang] || messages.en;
}
