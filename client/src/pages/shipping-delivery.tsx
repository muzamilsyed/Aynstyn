export default function ShippingDelivery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Shipping and Delivery Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-600 mb-8 text-center">
              <strong>Effective Date: April 22, 2025</strong>
            </p>
            
            <p className="mb-8">
              At Aynstyn.com, most of our offerings are digital and are delivered electronically. However, in cases where physical materials or merchandise are offered, the following policy applies.
            </p>

            <section className="mb-8 bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digital Deliveries</h2>
              
              <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
                <li>All assessments, tools, and content are provided online via your user dashboard or email.</li>
                <li>You will receive instant access or delivery within <strong>1–5 minutes</strong> of purchase confirmation.</li>
                <li>If you do not receive access or confirmation, please contact us immediately at <a href="mailto:muzamil@aynstyn.com" className="text-blue-600 hover:text-blue-800">muzamil@aynstyn.com</a>.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Physical Shipping (If Applicable)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">📦 Shipping Time</h3>
                  <p className="text-gray-600">Orders are typically shipped within <strong>3–5 business days</strong>.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">🚚 Delivery Estimates</h3>
                  <p className="text-gray-600">Depending on your location, delivery may take <strong>7–14 business days</strong>.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">💰 Shipping Charges</h3>
                  <p className="text-gray-600">Shipping fees (if any) will be clearly mentioned at checkout.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">📍 Tracking</h3>
                  <p className="text-gray-600">Tracking information will be provided once your order has been dispatched.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delays or Lost Packages</h2>
              <p className="mb-4">
                If your package is delayed or lost, please notify us at the earliest. We will work with our shipping partners to resolve the issue and, where applicable, resend or refund the product.
              </p>
            </section>

            <section className="mb-8 bg-blue-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Questions About Delivery?</h2>
              <p className="mb-4">
                If you have any questions about shipping or delivery, please don't hesitate to contact us:
              </p>
              <div className="bg-white p-4 rounded-lg">
                <p className="mb-2">
                  📧 <strong>Email:</strong> <a href="mailto:muzamil@aynstyn.com" className="text-blue-600 hover:text-blue-800">muzamil@aynstyn.com</a>
                </p>
                <p>
                  🌐 <strong>Website:</strong> <a href="http://www.aynstyn.com" className="text-blue-600 hover:text-blue-800">www.aynstyn.com</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}