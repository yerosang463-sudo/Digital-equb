import { Link } from "react-router";
import { Button } from "../ui/button";

function PricingSection() {
  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for small groups getting started",
      features: [
        "Up to 5 members per group",
        "Basic group management",
        "Manual winner selection",
        "Email notifications"
      ],
      highlighted: false
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Ideal for growing communities",
      features: [
        "Up to 20 members per group",
        "Automated contributions",
        "Random winner selection",
        "Advanced analytics",
        "Priority support"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations and businesses",
      features: [
        "Unlimited members",
        "Custom branding",
        "API access",
        "Dedicated support",
        "Advanced security features"
      ],
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that works best for your savings group. Start free and upgrade as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-blue-600 text-white shadow-2xl scale-105"
                  : "bg-white border border-gray-200 shadow-lg"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-blue-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-lg ${plan.highlighted ? "text-blue-100" : "text-gray-600"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`${plan.highlighted ? "text-blue-100" : "text-gray-600"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="text-green-400 mr-2 mt-1">✓</span>
                    <span className={plan.highlighted ? "text-white" : "text-gray-700"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/login">
              <Button
                className={`w-full py-3 ${
                  plan.highlighted
                    ? "bg-white text-blue-600 hover:bg-gray-100"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Get Started
              </Button>
            </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
