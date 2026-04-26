import { lazy } from 'react';

export const HowItWorksSection = lazy(() => import('./HowItWorksSection'));

function HowItWorksSectionComponent() {
  const steps = [
    {
      number: "1",
      title: "Create or Join Group",
      description: "Start your own savings group or join an existing one with trusted community members."
    },
    {
      number: "2", 
      title: "Set Contribution Rules",
      description: "Define contribution amounts, cycle frequency, and member limits that work for everyone."
    },
    {
      number: "3",
      title: "Automated Contributions",
      description: "Members contribute regularly through secure payment methods with automatic tracking."
    },
    {
      number: "4",
      title: "Fair Winner Selection",
      description: "Transparent random selection ensures every member gets their turn to receive the pooled funds."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How Digital Equb Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple, transparent, and fair savings management in four easy steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                {step.number}
              </div>
              
              {/* Step Card */}
              <div className="pt-8 px-6 pb-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-blue-200 -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSectionComponent;
