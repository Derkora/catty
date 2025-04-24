/**
 * dokumen controller
 */

import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';
const { ApplicationError } = errors;

// Define the interface for our Dokumen entity with markdownFile
interface DokumenEntity {
  id: any;
  namaDokumen?: string;
  jenisDokumen?: 'Dokumen_MataKuliah' | 'Dokumen_Administrasi';
  extractedDokumen?: string;
  isProcessed?: boolean;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  markdownFile?: {
    id: any;
    url: string;
    name: string;
    mime: string;
  };
  fileDokumen?: any[];
}

export default factories.createCoreController('api::dokumen.dokumen', ({ strapi }) => ({
  async find(ctx) {
    return await super.find(ctx);
  },

  async findOne(ctx) {
    return await super.findOne(ctx);
  },

  async create(ctx) {
    return await super.create(ctx);
  },

  async update(ctx) {
    return await super.update(ctx);
  },

  async delete(ctx) {
    return await super.delete(ctx);
  },

  async uploadMarkdownFile(ctx) {
    try {
      const { id } = ctx.params;
      if (!id) {
        return ctx.badRequest('Document ID is required');
      }

      // Check if files were uploaded
      if (!ctx.request.files || Object.keys(ctx.request.files).length === 0) {
        return ctx.badRequest('No files were uploaded');
      }

      console.log('Files in request:', ctx.request.files);
      
      // Get the first file (regardless of key name)
      const fileKey = Object.keys(ctx.request.files)[0];
      const uploadedFile = ctx.request.files[fileKey];
      
      console.log('Using file:', fileKey, uploadedFile);

      try {
        // Upload the file to Strapi media library
        const result = await strapi.plugins.upload.services.upload.upload({
          data: {},
          files: uploadedFile
        });
        
        if (!result || !Array.isArray(result) || result.length === 0) {
          return ctx.badRequest('Upload failed');
        }
        
        // Update the document with the file reference
        const updatedDocument = await strapi.entityService.update('api::dokumen.dokumen', id, {
          data: {
            markdownFile: result[0].id,
            isProcessed: true
          }
        });
        
        return {
          success: true,
          document: updatedDocument,
          file: result[0]
        };
      } catch (error) {
        console.error('Upload error:', error);
        return ctx.badRequest(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in uploadMarkdownFile:', error);
      return ctx.badRequest(`Error processing request: ${error.message}`);
    }
  },

  async getUnprocessedDocuments(ctx) {
    try {
      const documents = await strapi.entityService.findMany('api::dokumen.dokumen', {
        filters: {
          isProcessed: false
        },
        populate: ['fileDokumen']
      });
      
      return documents;
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  },

  async getMarkdownFile(ctx) {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        return ctx.badRequest('Document ID is required');
      }
      
      const document = await strapi.entityService.findOne('api::dokumen.dokumen', id, {
        populate: ['markdownFile']
      }) as DokumenEntity;
      
      if (!document || !document.markdownFile) {
        return ctx.notFound('Markdown file not found');
      }
      
      // Return the file URL instead of the content
      const fileUrl = document.markdownFile.url;
      return { 
        document: {
          id: document.id,
          namaDokumen: document.namaDokumen,
          jenisDokumen: document.jenisDokumen
        },
        markdownFile: document.markdownFile
      };
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  },

  async getAllMarkdownFiles(ctx) {
    try {
      const documents = await strapi.entityService.findMany('api::dokumen.dokumen', {
        filters: {
          isProcessed: true
        },
        populate: ['markdownFile']
      }) as DokumenEntity[];
      
      return documents.map(doc => ({
        id: doc.id,
        namaDokumen: doc.namaDokumen,
        jenisDokumen: doc.jenisDokumen,
        markdownFile: doc.markdownFile
      }));
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  }
}));
