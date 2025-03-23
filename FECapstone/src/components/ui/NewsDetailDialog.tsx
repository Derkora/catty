import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "../../lib/utils";

interface NewsDetailDialogProps {
  title: string;
  description: string;
  content: string;
  date: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  source?: string;
  className?: string;
}

const NewsDetailDialog: React.FC<NewsDetailDialogProps> = ({
  title,
  description,
  content,
  date,
  imageUrl,
  author,
  category,
  source,
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    console.log(`Image error for: "${title}"`);
    setImgError(true);
  };

  const formattedContent = content
    .split("\n")
    .map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("", className)}>
          Lihat Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 items-center text-sm mt-2">
            <span>{date}</span>
            {author && (
              <>
                <span>•</span>
                <span>{author}</span>
              </>
            )}
            {source && (
              <>
                <span>•</span>
                <span>{source}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {imageUrl && !imgError && (
          <div className="rounded-md overflow-hidden mb-4 bg-slate-100">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto object-cover"
              onError={handleImageError}
            />
          </div>
        )}

        {category && (
          <Badge variant="outline" className="mb-4">
            {category}
          </Badge>
        )}

        <div className="prose prose-sm max-w-none">
          <p className="font-semibold text-foreground mb-4">{description}</p>
          {formattedContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsDetailDialog; 