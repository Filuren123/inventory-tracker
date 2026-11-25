import type { Product } from '../../model/product.interface';

interface Props {
    product: Product;
    categoryLabel: string;
}

const formatSize = (p: Product) =>
    p.package_size != null ? `${Number(p.package_size)}${p.unit ? ` ${p.unit}` : ''}` : null;

/** Read-only summary of a product. */
const ProductDetails = ({ product, categoryLabel }: Props) => {
    const rows: [string, string | null][] = [
        ['Brand', product.brand],
        ['Category', categoryLabel || 'Uncategorised'],
        ['EAN', product.ean_code],
        ['Default location', product.default_storage_location],
        ['Package size', formatSize(product)],
        ['Minimum quantity', String(product.minimum_quantity)],
        [
            'Lowest price',
            product.min_price != null
                ? `${Number(product.min_price).toFixed(2)} kr${product.min_price_location ? ` · ${product.min_price_location}` : ''}`
                : null,
        ],
    ];

    return (
        <div className="product-details">
            <h2>{product.name}</h2>
            <dl>
                {rows
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                        <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                        </div>
                    ))}
            </dl>
            {product.link && (
                <a href={product.link} target="_blank" rel="noreferrer" className="product-link">
                    Product page ↗
                </a>
            )}
        </div>
    );
};

export default ProductDetails;
