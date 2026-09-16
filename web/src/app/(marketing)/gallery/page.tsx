import Link from "next/link";
import { PhpReferenceShell, phpAsset } from "@/components/marketing/PhpReferenceSite";

const images = [
  ["personal-train.png", "Personal training"],
  ["group-train.png", "Group training"],
  ["meal-plan2.png", "Nutrition planning"],
  ["placeholder-1.jpg", "365 Fitness"],
  ["placeholder-2.jpg", "Coaching"],
  ["placeholder-3.jpg", "Training"],
];

export default function GalleryPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">365 FITNESS <span>GALLERY</span></h1>
          <p className="php-subtitle">Images carried from the PHP reference asset folder into the production Next app.</p>
          <div className="php-grid php-grid-3">
            {images.map(([src, alt]) => (
              <div className="php-card" key={src}>
                <img src={phpAsset(src)} alt={alt} className="php-card-img" />
              </div>
            ))}
          </div>
          <div className="php-content-section php-cta-card php-center">
            <h3 className="php-heading-teal">See More Daily Work</h3>
            <p>Follow @365fitnessgnd for current public updates.</p>
            <Link href="https://www.instagram.com/365fitnessgnd/" className="php-btn php-btn-primary">Open Instagram</Link>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
