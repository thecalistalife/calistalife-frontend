export default function ShippingPolicy(){
  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto prose">
          <h1>Shipping Policy</h1>
          <p>We offer Standard (3–7 business days) and Express (1–3 business days) shipping. Delivery time depends on destination and courier capacity.</p>
          <ul>
            <li>Orders placed before 2 PM are typically dispatched the same day.</li>
            <li>Free shipping on orders above the threshold displayed at checkout.</li>
            <li>International shipping available to select countries; duties/taxes may apply.</li>
          </ul>
          <h3>Delivery Partners</h3>
          <p>We work with trusted partners and provide tracking for every shipment.</p>
          <h3>Address Requirements</h3>
          <p>Please provide complete address details and a reachable phone number to avoid delays.</p>
        </div>
      </div>
    </div>
  )
}
