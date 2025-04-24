// path: config/plugins.js
module.exports = {
    upload: {
      config: {
        actionOptions: {
          upload: {
            allowedTypes: [
              'text/markdown',
              'text/x-markdown',
              'text/plain', // kadang md dianggap ini juga
            ],
          },
        },
      },
    },
  };
  