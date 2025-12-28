export const ar = {
    // Common
    common: {
        loading: "جاري التحميل...",
        save: "حفظ",
        cancel: "إلغاء",
        delete: "حذف",
        edit: "تعديل",
        add: "إضافة",
        search: "بحث",
        filter: "تصفية",
        close: "إغلاق",
        confirm: "تأكيد",
        back: "رجوع",
        next: "التالي",
        previous: "السابق",
        submit: "إرسال",
        reset: "إعادة تعيين",
        view: "عرض",
        download: "تحميل",
        upload: "رفع",
        select: "اختر",
        all: "الكل",
        none: "لا شيء",
        yes: "نعم",
        no: "لا",
    },

    // Calendar
    calendar: {
        title: "التقويم",
        weekDays: {
            sunday: "الأحد",
            monday: "الاثنين",
            tuesday: "الثلاثاء",
            wednesday: "الأربعاء",
            thursday: "الخميس",
            friday: "الجمعة",
            saturday: "السبت",
        },
        status: {
            available: "متاح",
            booked: "محجوز",
            maintenance: "صيانة",
            startingFrom: "يبدأ من",
        },
        loadingCalendar: "جاري تحميل التقويم...",
    },

    // Navigation
    nav: {
        dashboard: "لوحة التحكم",
        calendar: "التقويم",
        halls: "القاعات",
        bookings: "الحجوزات",
        clients: "العملاء",
        payments: "المدفوعات",
        pricing: "التسعير",
        settings: "الإعدادات",
        logout: "تسجيل الخروج",
    },

    // Dashboard
    dashboard: {
        title: "لوحة التحكم",
        stats: {
            totalRevenue: "إجمالي الإيرادات",
            totalBookings: "إجمالي الحجوزات",
            pendingPayments: "المدفوعات المعلقة",
            activeHalls: "القاعات النشطة",
        },
        recentBookings: "الحجوزات الأخيرة",
        upcomingEvents: "الفعاليات القادمة",
    },

    // Bookings
    bookings: {
        title: "الحجوزات",
        newBooking: "حجز جديد",
        bookingDetails: "تفاصيل الحجز",
        clientName: "اسم العميل",
        hallName: "اسم القاعة",
        eventDate: "تاريخ الفعالية",
        status: "الحالة",
        totalAmount: "المبلغ الإجمالي",
        paidAmount: "المبلغ المدفوع",
        remainingAmount: "المبلغ المتبقي",
        package: "الباقة",
        notes: "ملاحظات",
    },

    // Halls
    halls: {
        title: "القاعات",
        newHall: "قاعة جديدة",
        hallDetails: "تفاصيل القاعة",
        hallName: "اسم القاعة",
        capacity: "السعة",
        location: "الموقع",
        description: "الوصف",
        basePrice: "السعر الأساسي",
        status: "الحالة",
        active: "نشط",
        inactive: "غير نشط",
    },

    // Clients
    clients: {
        title: "العملاء",
        newClient: "عميل جديد",
        clientDetails: "تفاصيل العميل",
        clientName: "اسم العميل",
        phone: "رقم الهاتف",
        email: "البريد الإلكتروني",
        address: "العنوان",
        totalBookings: "إجمالي الحجوزات",
        totalSpent: "إجمالي المصروفات",
    },

    // Payments
    payments: {
        title: "المدفوعات",
        newPayment: "دفعة جديدة",
        paymentDetails: "تفاصيل الدفعة",
        amount: "المبلغ",
        paymentDate: "تاريخ الدفع",
        paymentMethod: "طريقة الدفع",
        status: "الحالة",
        paid: "مدفوع",
        pending: "معلق",
        cancelled: "ملغي",
        cash: "نقدي",
        card: "بطاقة",
        transfer: "تحويل",
    },

    // Pricing
    pricing: {
        title: "التسعير",
        pricingRules: "قواعد التسعير",
        discounts: "الخصومات",
        overrides: "التجاوزات",
        packages: "الباقات",
        basePrice: "السعر الأساسي",
        seasonalPricing: "التسعير الموسمي",
    },

    // Settings
    settings: {
        title: "الإعدادات",
        general: "عام",
        profile: "الملف الشخصي",
        security: "الأمان",
        notifications: "الإشعارات",
        language: "اللغة",
        theme: "المظهر",
    },

    // Auth
    auth: {
        login: "تسجيل الدخول",
        logout: "تسجيل الخروج",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        forgotPassword: "نسيت كلمة المرور؟",
        rememberMe: "تذكرني",
        signIn: "تسجيل الدخول",
        signUp: "إنشاء حساب",
        unauthorized: "غير مصرح",
    },

    // Currency
    currency: {
        sar: "ر.س",
        riyal: "ريال",
        riyals: "ريالات",
    },

    // Messages
    messages: {
        success: {
            saved: "تم الحفظ بنجاح",
            deleted: "تم الحذف بنجاح",
            updated: "تم التحديث بنجاح",
            created: "تم الإنشاء بنجاح",
        },
        error: {
            general: "حدث خطأ ما",
            notFound: "غير موجود",
            unauthorized: "غير مصرح",
            validation: "خطأ في التحقق من البيانات",
        },
    },
};

export type Translations = typeof ar;

