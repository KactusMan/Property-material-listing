import { useState, useEffect } from 'react';

const translations = {
  en: {
    // Top & Navigation
    dashboard: 'Dashboard',
    properties: 'Properties',
    materialRequests: 'Material Requests',
    materialsCatalog: 'Approved Catalog',
    contractors: 'Contractors',
    productsManagement: 'Master Catalog',
    settings: 'Settings',
    logout: 'Sign Out',
    searchPlaceholder: 'Search properties, materials, requests...',
    adminRole: 'Admin',
    contractorRole: 'Contractor',

    // Contractor View
    newMaterialRequest: 'New Material Request',
    myRequests: 'My Requests',
    selectProperty: 'Select Job Site Property',
    chooseAssignedProperty: '-- Choose Assigned Property --',
    approvedCatalog: 'Approved Materials Catalog',
    searchMaterials: 'Search materials...',
    allCategories: 'All',
    unit: 'Unit',
    selectedItems: 'Selected Items',
    submitRequest: 'Submit Material Request',
    submitting: 'Submitting...',
    orderNotes: 'Additional Order Notes',
    notesPlaceholder: 'Provide delivery instructions, unit/room details, or urgency...',
    noRequestsYet: 'You have not submitted any material requests yet.',
    itemsRequested: 'Items Requested',

    // Admin View
    totalMonies: 'Total Monies Allocated',
    pendingReview: 'Pending Admin Review',
    approvedOrders: 'Approved Orders',
    activeContractors: 'Active Contractors',
    overviewTab: 'Overview',
    materialApprovals: 'Material Approvals',
    contractorAssignments: 'Contractors & Assigned Properties',
    masterProductCatalog: 'Master Products Catalog',

    // Request Card Actions
    approveRequest: '✓ Approve Request',
    markOrdered: '📦 Mark as Ordered',
    markDelivered: '🚚 Mark Delivered',
    viewLineItems: 'View Line Items',
    hideItems: 'Hide Line Items',
    openSupplierLink: '🔗 Open Supplier / Amazon Link',
    openAllSupplierLinks: '🛒 Open All Product Links',
    expectedUnitPrice: 'Expected Price',
    estimatedLineTotal: 'Line Total',

    // Statuses
    submitted: 'Submitted',
    approved: 'Approved',
    ordered: 'Ordered',
    delivered: 'Delivered',

    // Master Catalog Admin
    addNewProduct: '+ Add New Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    category: 'Category',
    modelDetails: 'Exact Model / Size / Color',
    supplierLink: 'Amazon / Supplier Link',
    expectedPrice: 'Expected Price ($)',
    imageUrl: 'Image URL',
    active: 'Active',
    inactive: 'Inactive',
    saveProduct: 'Save Product',
    cancel: 'Cancel',

    // Contractor Management
    assignedProperties: 'Assigned Properties',
    assignProperty: 'Assign Property',
    unassign: 'Remove',
    noAssignedProperties: 'No specific properties assigned (can access all active properties)',
  },
  es: {
    // Top & Navigation
    dashboard: 'Panel Principal',
    properties: 'Propiedades',
    materialRequests: 'Solicitudes de Material',
    materialsCatalog: 'Catálogo Aprobado',
    contractors: 'Contratistas',
    productsManagement: 'Catálogo Maestro',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    searchPlaceholder: 'Buscar propiedades, materiales, solicitudes...',
    adminRole: 'Administrador',
    contractorRole: 'Contratista',

    // Contractor View
    newMaterialRequest: 'Nueva Solicitud de Materiales',
    myRequests: 'Mis Solicitudes',
    selectProperty: 'Seleccionar Propiedad de la Obra',
    chooseAssignedProperty: '-- Seleccionar Propiedad Asignada --',
    approvedCatalog: 'Catálogo de Materiales Aprobados',
    searchMaterials: 'Buscar materiales...',
    allCategories: 'Todos',
    unit: 'Unidad',
    selectedItems: 'Artículos Seleccionados',
    submitRequest: 'Enviar Solicitud de Materiales',
    submitting: 'Enviando...',
    orderNotes: 'Notas Adicionales de la Orden',
    notesPlaceholder: 'Instrucciones de entrega, detalles de la habitación o urgencia...',
    noRequestsYet: 'Aún no ha enviado ninguna solicitud de material.',
    itemsRequested: 'Artículos Solicitados',

    // Admin View
    totalMonies: 'Total de Fondos Asignados',
    pendingReview: 'Pendiente de Revisión',
    approvedOrders: 'Pedidos Aprobados',
    activeContractors: 'Contratistas Activos',
    overviewTab: 'Resumen General',
    materialApprovals: 'Aprobación de Materiales',
    contractorAssignments: 'Contratistas y Propiedades Asignadas',
    masterProductCatalog: 'Catálogo Maestro de Productos',

    // Request Card Actions
    approveRequest: '✓ Aprobar Solicitud',
    markOrdered: '📦 Marcar como Pedido',
    markDelivered: '🚚 Marcar Entregado',
    viewLineItems: 'Ver Detalles del Pedido',
    hideItems: 'Ocultar Detalles',
    openSupplierLink: '🔗 Abrir Enlace de Amazon / Proveedor',
    openAllSupplierLinks: '🛒 Abrir Todos los Enlaces de Productos',
    expectedUnitPrice: 'Precio Unitario Esperado',
    estimatedLineTotal: 'Total de Línea',

    // Statuses
    submitted: 'Enviado',
    approved: 'Aprobado',
    ordered: 'Pedido',
    delivered: 'Entregado',

    // Master Catalog Admin
    addNewProduct: '+ Agregar Nuevo Producto',
    editProduct: 'Editar Producto',
    productName: 'Nombre del Producto',
    category: 'Categoría',
    modelDetails: 'Modelo / Tamaño / Color Exacto',
    supplierLink: 'Enlace de Amazon / Proveedor',
    expectedPrice: 'Precio Esperado ($)',
    imageUrl: 'URL de Imagen',
    active: 'Activo',
    inactive: 'Inactivo',
    saveProduct: 'Guardar Producto',
    cancel: 'Cancelar',

    // Contractor Management
    assignedProperties: 'Propiedades Asignadas',
    assignProperty: 'Asignar Propiedad',
    unassign: 'Quitar',
    noAssignedProperties: 'Sin propiedades específicas asignadas (acceso a todas)',
  }
};

export function getLanguage() {
  return localStorage.getItem('pm_lang') || 'en';
}

export function setLanguage(lang) {
  localStorage.setItem('pm_lang', lang);
  window.dispatchEvent(new Event('languagechange'));
}

export function useI18n() {
  const [lang, setLangState] = useState(getLanguage());

  useEffect(() => {
    const handleLangChange = () => setLangState(getLanguage());
    window.addEventListener('languagechange', handleLangChange);
    return () => window.removeEventListener('languagechange', handleLangChange);
  }, []);

  const t = (key) => {
    return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
  };

  return { t, lang, setLanguage };
}
