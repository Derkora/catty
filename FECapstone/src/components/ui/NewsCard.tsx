import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Badge } from './badge';
import NewsDetailDialog from './NewsDetailDialog';

interface NewsCardProps {
  documentId: string;
  title: string;
  description: string;
  date: string;
  content: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  source?: string;
  useDialog?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  documentId,
  title, 
  description, 
  date, 
  content,
  imageUrl,
  author,
  category,
  source,
  useDialog = true
}) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  
  useEffect(() => {
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      console.log(`Setting image for "${title}": ${imageUrl}`);
      setImageSrc(imageUrl);
    } else {
      console.log(`No valid image URL for "${title}", using placeholder`);
      setImageSrc('/images/news-placeholder.jpg');
    }
  }, [imageUrl, title]);
  
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleImageError = () => {
    console.log(`Image error for: "${title}", URL: ${imageSrc}`);
    setImgError(true);
    setImageSrc('/images/news-placeholder.jpg');
  };

  const handleOpenFullPage = () => {
    navigate(`/news/${documentId}`);
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
      <div className="h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={imgError ? '/images/news-placeholder.jpg' : imageSrc}
          alt={title}
          className="h-full w-full object-cover transition-transform hover:scale-105 cursor-pointer"
          onError={handleImageError}
          onClick={handleOpenFullPage}
        />
      </div>
      <CardHeader className="px-6 pt-6 pb-0">
        <Badge variant="primary" className="mb-2 self-start">
          {category || date}
        </Badge>
        <CardTitle 
          className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors"
          onClick={handleOpenFullPage}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardDescription>
          {truncateText(description, 150)}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex gap-2 flex-wrap">
        {useDialog && (
          <NewsDetailDialog
            title={title}
            description={description}
            content={content || 'Konten berita belum tersedia.'}
            date={date}
            imageUrl={imageSrc}
            author={author}
            category={category}
            source={source}
          />
        )}
        <Button variant="default" size="sm" onClick={handleOpenFullPage}>
          Halaman Lengkap
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewsCard; 