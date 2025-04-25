/**
 * dokumen router
 */

export default {
  routes: [
    // Standard routes
    {
      method: 'GET',
      path: '/dokumens',
      handler: 'dokumen.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/dokumens/:id',
      handler: 'dokumen.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/dokumens',
      handler: 'dokumen.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/dokumens/:id',
      handler: 'dokumen.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/dokumens/:id',
      handler: 'dokumen.delete',
      config: {
        auth: false,
      },
    },
    // Custom routes for markdown file handling
    {
      method: 'POST',
      path: '/dokumens/:id/upload-markdown',
      handler: 'dokumen.uploadMarkdownFile',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/dokumens/:id/markdown-file',
      handler: 'dokumen.getMarkdownFile',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/dokumens-markdown-files',
      handler: 'dokumen.getAllMarkdownFiles',
      config: {
        auth: false,
      },
    },
  ],
};
