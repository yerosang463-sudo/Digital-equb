function HowItWorksSection() {
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
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-white via-blue-50 to-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <div key={index} className="relative group active:scale-95 transition-transform duration-150">
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 group-hover:rotate-12 group-active:scale-125 transition-all duration-300">
                {step.number}
              </div>
              
              {/* Step Card */}
              <div className="pt-10 px-6 pb-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200 active:shadow-xl active:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-2 active:-translate-y-1 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-white active:bg-gradient-to-br active:from-blue-100 active:to-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center group-hover:text-blue-600 active:text-blue-700 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-blue-300 to-transparent -translate-y-1/2 group-hover:animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
