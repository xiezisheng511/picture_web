interface Props {
  src: string;
  alt?: string;
  className?: string;
  checkerboard?: boolean;
  ref?: React.RefObject<HTMLImageElement>;
}

export default function ImagePreview({
  src,
  alt = 'preview',
  className = '',
  checkerboard = false,
  ref,
}: Props) {
  return (
    <div
      className={`rounded-lg overflow-hidden border border-gray-200 ${
        checkerboard ? 'bg-checkerboard' : 'bg-gray-50'
      } ${className}`}
    >
      <img
        ref={ref}
        src={src}
        alt={alt}
        className="block max-w-full max-h-96 mx-auto object-contain"
      />
    </div>
  );
}