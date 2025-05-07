import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatMarkdown = (text: string) => {
  if (!text) return '';
  
  let formattedText = text.replace(
    /```([a-z]*)\n([\s\S]*?)```/g, 
    (_, language, code) => {
      return `<pre class="bg-slate-100 p-3 rounded-md overflow-x-auto"><code class="language-${language || 'plaintext'}">${code.replace(/</g, '<').replace(/>/g, '>')}</code></pre>`;
    }
  );
  
  formattedText = formattedText.replace(
    /`([^`]+)`/g, 
    (_, code) => {
      return `<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">${code.replace(/</g, '<').replace(/>/g, '>')}</code>`;
    }
  );
  
  // Process tables
  formattedText = formattedText.replace(
    /\|(.+)\|\n\|([-:]+[-| :]*)\|\n((.*\|.*\n)+)/g,
    (_, header, alignment, rows) => {
      const headerCells = header.split('|').map((cell: string) => cell.trim());
      const alignmentCells = alignment.split('|').map((cell: string) => {
        if (cell.trim().startsWith(':') && cell.trim().endsWith(':')) return 'text-center';
        if (cell.trim().endsWith(':')) return 'text-right';
        return 'text-left';
      });
      
      let tableHTML = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-slate-300">\n<thead>\n<tr>\n';
      
      // Generate header row
      headerCells.forEach((cell: string, i: number) => {
        if (cell) {
          const align = alignmentCells[i] || 'text-left';
          tableHTML += `<th class="border border-slate-300 px-4 py-2 bg-slate-100 ${align}">${cell}</th>\n`;
        }
      });
      
      tableHTML += '</tr>\n</thead>\n<tbody>\n';
      
      // Generate data rows
      const rowsArray = rows.trim().split('\n');
      rowsArray.forEach((row: string) => {
        const cells = row.split('|').map((cell: string) => cell.trim());
        tableHTML += '<tr>\n';
        cells.forEach((cell: string, i: number) => {
          if (cell !== undefined) {
            const align = alignmentCells[i] || 'text-left';
            tableHTML += `<td class="border border-slate-300 px-4 py-2 ${align}">${cell}</td>\n`;
          }
        });
        tableHTML += '</tr>\n';
      });
      
      tableHTML += '</tbody>\n</table></div>';
      return tableHTML;
    }
  );
  
  // Process headers
  formattedText = formattedText
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  // Process lists
  formattedText = formattedText
    .replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="ml-6 list-decimal">$1</li>')
    .replace(/^\s*[\-\*]\s+(.*$)/gm, '<li class="ml-6 list-disc">$1</li>');
  
  // Replace consecutive list items with proper list elements
  formattedText = formattedText
    .replace(/<\/li>\n<li class="ml-6 list-decimal">/g, '</li><li class="ml-6 list-decimal">')
    .replace(/<\/li>\n<li class="ml-6 list-disc">/g, '</li><li class="ml-6 list-disc">')
    .replace(/<li class="ml-6 list-decimal">(.+?)(<\/li>)+/g, '<ol class="list-decimal pl-4 my-2">$&</ol>')
    .replace(/<li class="ml-6 list-disc">(.+?)(<\/li>)+/g, '<ul class="list-disc pl-4 my-2">$&</ul>');
  
  // Process bold and italic
  formattedText = formattedText
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\_\_(.+?)\_\_/g, '<strong>$1</strong>')
    .replace(/\_([^_]+)\_/g, '<em>$1</em>');
  
  // Process links
  formattedText = formattedText.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g, 
    '<a href="$2" target="_blank" class="text-blue-500 hover:underline">$1</a>'
  );
  
  // Replace newlines with <br> tags outside of code blocks
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};
