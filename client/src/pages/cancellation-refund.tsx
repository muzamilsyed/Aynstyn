export default function CancellationRefund() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Cancellation and Refund Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-600 mb-8 text-center">
              <strong>Effective Date: April 22, 2025</strong>
            </p>
            
            <p className="mb-8">
              At Aynstyn.com, we strive to ensure a smooth and satisfactory experience for all our users. Please read our Cancellation and Refund Policy carefully before making a purchase or subscription.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digital Products and Services</h2>
              
              <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-400 mb-4">
                <h3 className="text-xl font-medium text-gray-800 mb-3">No Refunds on Digital Services:</h3>
                <p className="mb-4">
                  Due to the nature of digital content and educational tools, we do not offer refunds once access has been granted or services have been rendered.
                </p>
              </div>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">Subscription Cancellations:</h3>
              <p className="mb-4">
                Users may cancel their subscriptions at any time. Cancellation will take effect at the end of the current billing cycle, and no pro-rated refunds will be issued for the remaining period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Accidental Charges or Errors</h2>
              <p className="mb-4">
                If you believe you have been charged in error, please contact us within <strong>7 days</strong> of the transaction. We will review the request and provide a resolution accordingly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Special Circumstances</h2>
              <p className="mb-4">
                Refunds may be granted under exceptional circumstances at our sole discretion. In such cases, users must provide sufficient information and reasoning for the request.
              </p>
            </section>

            <section className="mb-8 bg-blue-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
              <p className="mb-4">
                If you have questions about cancellations or refunds, please contact our support team:
              </p>
              <div className="bg-white p-4 rounded-lg">
                <p className="mb-2">
                  📧 <strong>Email:</strong> <a href="mailto:support@aynstyn.com" className="text-blue-600 hover:text-blue-800">support@aynstyn.com</a>
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