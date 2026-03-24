import Link from 'next/link';

import type { Product } from '@/lib/mock-data';
import { getStatusLabel } from '@/lib/status';

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/items/${product.id}`} className="card product-card">
      <div
        className="product-image"
        style={{ backgroundImage: `url(${product.imageUrl})` }}
      />
      <div className="product-body">
        <div className="row">
          <h3>{product.title}</h3>
          <span className={`badge badge-${product.status}`}>{getStatusLabel(product.status)}</span>
        </div>
        <p className="muted">{product.region}</p>
        <p className="price">{product.price.toLocaleString()}원</p>
        <p className="muted">{product.createdAt}</p>
      </div>
    </Link>
  );
}
