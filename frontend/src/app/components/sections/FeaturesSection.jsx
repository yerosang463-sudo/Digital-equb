import { lazy } from 'react';
import { Card, CardContent } from "../ui/card";

export const FeaturesSection = lazy(() => import('./FeaturesSection'));

function FeaturesSectionComponent() {
  const features = [
    {
      icon: "🤝",
      title: "Community Trust",
      description: "Built on traditional Equb values with modern security and transparency."
    },
    {
      icon: "💰",
      title: "Smart Savings",
      description: "Automated contributions, clear tracking, and fair winner selection."
    },
    {
      icon: "📱",
      title: "Easy Management",
      description: "Mobile-first design for convenient group management anywhere."
    },
    {
      icon: "🔒",
      title: "Secure Platform",
      description: "Bank-level encryption and fraud protection for your peace of mind."
    },
    {
      icon: "📊",
      title: "Transparent Analytics",
      description: "Real-time insights into group performance and contribution history."
    },
    {
      icon: "🎯",
      title: "Flexible Groups",
      description: "Customize contribution amounts, cycles, and member limits."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Digital Equb?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the perfect blend of tradition and technology with our modern savings platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSectionComponent;
