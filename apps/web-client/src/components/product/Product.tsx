import "./Product.css";
import React from "react";

const Product = () => {
    return (
        <article>
            <div className="heading">
                <h2>Kungsörnen</h2>
                <div className="ean">EAN: 21310889324823</div>
            </div>
            <div className="firstsec">
                <h1>Bakpulver</h1>
                <div className="category">CATEGORY</div>
            </div>
            <div className="secsec">
                <div className="bestbefore">
                    Best before: 6 mars, 2026
                </div>
                <div>
                    <button type="button" className="btn btn-primary">Se product</button>
                    <button type="button" className="btn btn-danger">Remove</button>
                </div>
            </div>
        </article>
    )
}

export default Product;