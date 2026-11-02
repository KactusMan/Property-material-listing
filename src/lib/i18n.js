import { useEffect, useState } from 'react';

// English and Spanish for everything vendors see. Admin-only screens are English.
const strings = {
  en: {
    signIn: 'Sign in',
    register: 'Create account',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 10 characters.',
    yourName: 'Your name',
    company: 'Company',
    companyHint: 'The business name you invoice under.',
    noAccount: 'New vendor?',
    haveAccount: 'Already have an account?',
    welcomeBack: 'Welcome back',
    signInSub: 'Sign in to order materials for your assigned properties.',
    registerSub: 'Register your company. The office approves new vendors before properties are assigned.',
    signOut: 'Sign out',
    language: 'Español',
    newRequest: 'Order materials',
    myRequests: 'My requests',
    suggest: 'Suggest a material',
    more: 'More',
    chooseProperty: 'Choose the property',
    chooseMaterials: 'Add materials',
    searchMaterials: 'Search materials',
    all: 'All',
    perUnit: 'per',
    add: 'Add',
    yourOrder: 'Your request',
    nothingSelected: 'Pick materials from the list. They will show up here.',
    notes: 'Notes for the office',
    notesPlaceholder: 'Room, delivery instructions, how urgent it is',
    estimatedTotal: 'Estimated total',
    submitRequest: 'Send request',
    sending: 'Sending',
    requestSent: 'Request sent. The office will review it.',
    reviewOrder: 'Review',
    items: 'items',
    noProperties: 'No properties assigned yet',
    noPropertiesBody: 'The office has not assigned a property to your account. Once they do, it will appear here and you can start ordering.',
    pendingTitle: 'Your account is waiting for approval',
    pendingBody: 'Thanks for registering. The office checks every new vendor before giving access to properties. You will be able to order materials as soon as you are approved.',
    noRequests: 'No requests yet',
    noRequestsBody: 'When you send a material request it shows up here with its status.',
    status: 'Status',
    property: 'Property',
    total: 'Total',
    submitted: 'Submitted',
    approved: 'Approved',
    ordered: 'Ordered',
    delivered: 'Delivered',
    rejected: 'Rejected',
    pending: 'Pending',
    suggestTitle: 'Suggest a material',
    suggestSub: 'Found something we should stock, or the same item for less? Send it here. The office reviews every suggestion before it goes into the catalogue.',
    suggestNew: 'New material',
    suggestPrice: 'Better price',
    materialName: 'Material name',
    whichMaterial: 'Which catalogue material',
    category: 'Category',
    unit: 'Unit',
    priceFound: 'Price you found (USD)',
    currentPrice: 'Current catalogue price',
    productLink: 'Product link',
    productLinkHint: 'Paste the Amazon, Home Depot or Lowe’s page.',
    details: 'Size, model, color',
    why: 'Why this one? (optional)',
    sendSuggestion: 'Send suggestion',
    suggestionSent: 'Suggestion sent for review.',
    mySuggestions: 'Your suggestions',
    noSuggestions: 'You have not suggested anything yet.',
    select: 'Select',
    officeNote: 'Office note',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    open: 'Open',
    retry: 'Try again',
    loadFailed: 'Could not load this page.'
  },
  es: {
    signIn: 'Iniciar sesión',
    register: 'Crear cuenta',
    email: 'Correo',
    password: 'Contraseña',
    passwordHint: 'Mínimo 10 caracteres.',
    yourName: 'Su nombre',
    company: 'Empresa',
    companyHint: 'El nombre con el que factura.',
    noAccount: '¿Proveedor nuevo?',
    haveAccount: '¿Ya tiene cuenta?',
    welcomeBack: 'Bienvenido',
    signInSub: 'Inicie sesión para pedir materiales para sus propiedades asignadas.',
    registerSub: 'Registre su empresa. La oficina aprueba a cada proveedor antes de asignarle propiedades.',
    signOut: 'Cerrar sesión',
    language: 'English',
    newRequest: 'Pedir materiales',
    myRequests: 'Mis pedidos',
    suggest: 'Sugerir material',
    more: 'Más',
    chooseProperty: 'Elija la propiedad',
    chooseMaterials: 'Agregue materiales',
    searchMaterials: 'Buscar materiales',
    all: 'Todos',
    perUnit: 'por',
    add: 'Agregar',
    yourOrder: 'Su pedido',
    nothingSelected: 'Elija materiales de la lista. Aparecerán aquí.',
    notes: 'Notas para la oficina',
    notesPlaceholder: 'Cuarto, instrucciones de entrega, urgencia',
    estimatedTotal: 'Total estimado',
    submitRequest: 'Enviar pedido',
    sending: 'Enviando',
    requestSent: 'Pedido enviado. La oficina lo revisará.',
    reviewOrder: 'Revisar',
    items: 'artículos',
    noProperties: 'Aún no tiene propiedades asignadas',
    noPropertiesBody: 'La oficina todavía no le ha asignado una propiedad. Cuando lo haga, aparecerá aquí y podrá hacer pedidos.',
    pendingTitle: 'Su cuenta está esperando aprobación',
    pendingBody: 'Gracias por registrarse. La oficina revisa a cada proveedor nuevo antes de dar acceso a las propiedades. Podrá pedir materiales en cuanto lo aprueben.',
    noRequests: 'Aún no hay pedidos',
    noRequestsBody: 'Cuando envíe un pedido de materiales aparecerá aquí con su estado.',
    status: 'Estado',
    property: 'Propiedad',
    total: 'Total',
    submitted: 'Enviado',
    approved: 'Aprobado',
    ordered: 'Ordenado',
    delivered: 'Entregado',
    rejected: 'Rechazado',
    pending: 'Pendiente',
    suggestTitle: 'Sugerir un material',
    suggestSub: '¿Encontró algo que deberíamos tener, o el mismo artículo más barato? Envíelo aquí. La oficina revisa cada sugerencia antes de agregarla al catálogo.',
    suggestNew: 'Material nuevo',
    suggestPrice: 'Mejor precio',
    materialName: 'Nombre del material',
    whichMaterial: 'Material del catálogo',
    category: 'Categoría',
    unit: 'Unidad',
    priceFound: 'Precio que encontró (USD)',
    currentPrice: 'Precio actual del catálogo',
    productLink: 'Enlace del producto',
    productLinkHint: 'Pegue la página de Amazon, Home Depot o Lowe’s.',
    details: 'Tamaño, modelo, color',
    why: '¿Por qué este? (opcional)',
    sendSuggestion: 'Enviar sugerencia',
    suggestionSent: 'Sugerencia enviada para revisión.',
    mySuggestions: 'Sus sugerencias',
    noSuggestions: 'Todavía no ha sugerido nada.',
    select: 'Seleccione',
    officeNote: 'Nota de la oficina',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    open: 'Abrir',
    retry: 'Reintentar',
    loadFailed: 'No se pudo cargar esta página.'
  }
};

const read = () => {
  try {
    return localStorage.getItem('mf_lang') === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

export function toggleLanguage() {
  try {
    localStorage.setItem('mf_lang', read() === 'es' ? 'en' : 'es');
  } catch {
    // Language falls back to English if storage is blocked.
  }
  window.dispatchEvent(new Event('mf-language'));
}

export function useI18n() {
  const [lang, setLang] = useState(read);
  useEffect(() => {
    const update = () => setLang(read());
    window.addEventListener('mf-language', update);
    return () => window.removeEventListener('mf-language', update);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = (key) => strings[lang][key] ?? strings.en[key] ?? key;
  const statusText = (status) => t(String(status || '').toLowerCase()) || status;
  return { t, lang, statusText };
}
