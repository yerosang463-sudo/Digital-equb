import { Card, CardContent } from "../ui/card";

function FeaturesSection() {
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
    <section id="features" className="py-20 bg-gradient-to-b from-gray-50 via-purple-50 to-gray-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <Card key={index} className="border-0 shadow-lg hover:shadow-2xl hover:shadow-purple-200 active:shadow-xl active:shadow-purple-300 transition-all duration-300 transform hover:-translate-y-3 active:-translate-y-2 group hover:bg-gradient-to-br hover:from-purple-50 hover:to-white active:bg-gradient-to-br active:from-purple-100 active:to-white">
              <CardContent className="p-8">
                <div className="text-5xl mb-4 group-hover:scale-125 group-hover:rotate-6 active:scale-150 active:rotate-12 transition-all duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-purple-600 active:text-purple-700 transition-colors duration-300">
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

export default FeaturesSection;
