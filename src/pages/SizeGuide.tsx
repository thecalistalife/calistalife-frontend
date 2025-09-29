export default function SizeGuide(){
  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto prose">
          <h1>Size Guide</h1>
          <p>Use our charts and measuring guide to find your perfect fit.</p>
          <table>
            <thead><tr><th>Size</th><th>Chest (in)</th><th>Waist (in)</th></tr></thead>
            <tbody>
              <tr><td>XS</td><td>32–34</td><td>26–28</td></tr>
              <tr><td>S</td><td>34–36</td><td>28–30</td></tr>
              <tr><td>M</td><td>38–40</td><td>32–34</td></tr>
              <tr><td>L</td><td>42–44</td><td>36–38</td></tr>
              <tr><td>XL</td><td>46–48</td><td>40–42</td></tr>
            </tbody>
          </table>
          <h3>How to Measure</h3>
          <p>Measure around the fullest part of your chest and the narrowest part of your waist. If between sizes, we recommend sizing up for a relaxed fit.</p>
        </div>
      </div>
    </div>
  )
}
