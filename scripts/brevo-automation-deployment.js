// CalistaLife Brevo Marketing Automation Deployment
// Deploy email templates and configure automation workflows

const SibApiV3Sdk = require('sib-api-v3-sdk');
const fs = require('fs');
const path = require('path');

// Initialize Brevo client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailTemplatesApi = new SibApiV3Sdk.EmailCampaignsApi();
const contactsApi = new SibApiV3Sdk.ContactsApi();
const webhooksApi = new SibApiV3Sdk.WebhooksApi();

// Import our enhanced email templates
const { 
  renderWelcomeEmail,
  renderAbandonedCartEmail,
  renderOrderConfirmationEmail,
  renderCareGuideEmail,
  renderReengagementEmail,
  renderReviewRequestEmail
} = require('../backend/src/templates/brevoEmailTemplates');

class BrevoDeploymentManager {
  constructor() {
    this.deploymentLog = [];
    this.templateIds = {};
    this.contactLists = {};
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.deploymentLog.push(logEntry);
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  }

  // Step 1: Create contact lists for segmentation
  async createContactLists() {
    this.log('Creating contact lists for customer segmentation...');
    
    const lists = [
      {
        name: 'Welcome Series - New Customers',
        folderId: 1
      },
      {
        name: 'Cart Recovery - Abandoned Cart',
        folderId: 1
      },
      {
        name: 'Premium Customers - High Value',
        folderId: 1
      },
      {
        name: 'Sustainability Focused - Eco Conscious',
        folderId: 1
      },
      {
        name: 'Re-engagement - Inactive Customers',
        folderId: 1
      }
    ];

    for (const listConfig of lists) {
      try {
        const response = await contactsApi.createList(listConfig);
        this.contactLists[listConfig.name] = response.id;
        this.log(`Created list: ${listConfig.name} (ID: ${response.id})`);
      } catch (error) {
        if (error.response?.body?.code === 'duplicate_parameter') {
          this.log(`List already exists: ${listConfig.name}`, 'warn');
        } else {
          this.log(`Failed to create list ${listConfig.name}: ${error.message}`, 'error');
        }
      }
    }
  }

  // Step 2: Create email templates
  async createEmailTemplates() {
    this.log('Creating optimized email templates...');

    // Sample customer data for template creation
    const sampleCustomer = {
      email: 'customer@example.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      totalSpent: 250,
      orderCount: 3,
      preferredCategories: ['Dresses', 'Sustainable Fashion'],
      qualityScore: 4.5
    };

    const sampleOrder = {
      order_number: 'CL-2024-001',
      total: 185.50,
      items: [
        {
          name: 'Sustainable Silk Dress',
          quantity: 1,
          price: 149.99,
          image_url: 'https://example.com/dress.jpg'
        },
        {
          name: 'Organic Cotton Cardigan',
          quantity: 1,
          price: 79.99,
          image_url: 'https://example.com/cardigan.jpg'
        }
      ],
      estimated_delivery: 'December 5, 2024'
    };

    const templates = [
      {
        name: 'Welcome Series - New Customer Onboarding',
        template: renderWelcomeEmail(sampleCustomer),
        category: 'welcome'
      },
      {
        name: 'Abandoned Cart Recovery - Premium Items',
        template: renderAbandonedCartEmail(sampleCustomer, [
          { id: '1', name: 'Premium Dress', price: 149.99, quality_grade: 'Premium', sustainability_rating: 4.5 }
        ]),
        category: 'cart_recovery'
      },
      {
        name: 'Order Confirmation - Quality Focus',
        template: renderOrderConfirmationEmail(sampleCustomer, sampleOrder),
        category: 'transactional'
      },
      {
        name: 'Care Guide - Premium Quality Care',
        template: renderCareGuideEmail(sampleCustomer, sampleOrder),
        category: 'care_guide'
      },
      {
        name: 'Re-engagement - Win Back Premium Customers',
        template: renderReengagementEmail(sampleCustomer),
        category: 'reengagement'
      },
      {
        name: 'Review Request - Quality Feedback',
        template: renderReviewRequestEmail(sampleCustomer, sampleOrder),
        category: 'review_request'
      }
    ];

    for (const templateConfig of templates) {
      try {
        const templateData = {
          name: templateConfig.name,
          subject: templateConfig.template.subject,
          sender: {
            name: 'CalistaLife',
            email: 'campaigns@calistalife.com'
          },
          htmlContent: templateConfig.template.html,
          tag: templateConfig.category,
          isActive: true
        };

        const response = await emailTemplatesApi.createEmailTemplate(templateData);
        this.templateIds[templateConfig.category] = response.id;
        this.log(`Created template: ${templateConfig.name} (ID: ${response.id})`);
      } catch (error) {
        this.log(`Failed to create template ${templateConfig.name}: ${error.message}`, 'error');
      }
    }
  }

  // Step 3: Configure webhooks for monitoring
  async configureWebhooks() {
    this.log('Configuring webhooks for email monitoring...');

    const webhookConfig = {
      url: 'https://calistalife.com/webhooks/brevo',
      description: 'CalistaLife Email Monitoring Webhook',
      events: [
        'delivered',
        'hardBounce',
        'softBounce',
        'spam',
        'unsubscribed',
        'opened',
        'clicked',
        'blocked'
      ]
    };

    try {
      const response = await webhooksApi.createWebhook(webhookConfig);
      this.log(`Configured webhook: ${response.id}`);
    } catch (error) {
      if (error.response?.body?.code === 'duplicate_parameter') {
        this.log('Webhook already configured', 'warn');
      } else {
        this.log(`Failed to configure webhook: ${error.message}`, 'error');
      }
    }
  }

  // Step 4: Create automation workflows (manual configuration required)
  generateAutomationGuide() {
    this.log('Generating automation workflow configuration guide...');
    
    return `
# CalistaLife Brevo Automation Workflows Configuration Guide

## 📧 Email Template IDs Created:
${Object.entries(this.templateIds).map(([key, id]) => `- ${key}: Template ID ${id}`).join('\n')}

## 📋 Contact Lists Created:
${Object.entries(this.contactLists).map(([name, id]) => `- ${name}: List ID ${id}`).join('\n')}

## 🔄 Automation Workflows to Configure in Brevo Dashboard:

### 1. Welcome Series Automation
- **Trigger**: Contact added to "Welcome Series - New Customers" list
- **Delay**: 30 minutes after signup
- **Template**: welcome (ID: ${this.templateIds.welcome || 'TBD'})
- **Frequency Cap**: Once per contact
- **Conditions**: None (send to all new customers)

### 2. Abandoned Cart Recovery - Stage 1
- **Trigger**: Custom event "cart_abandoned" 
- **Delay**: 2 hours after abandonment
- **Template**: cart_recovery (ID: ${this.templateIds.cart_recovery || 'TBD'})
- **Frequency Cap**: Once per 24 hours
- **Conditions**: Cart value > $25

### 3. Abandoned Cart Recovery - Stage 2  
- **Trigger**: 24 hours after Stage 1 sent + still abandoned
- **Template**: cart_recovery (ID: ${this.templateIds.cart_recovery || 'TBD'})
- **Frequency Cap**: Once per 72 hours
- **Conditions**: Cart value > $50, Premium items in cart

### 4. Order Confirmation (Transactional)
- **Trigger**: API call on order placement
- **Delay**: Immediate
- **Template**: transactional (ID: ${this.templateIds.transactional || 'TBD'})
- **Frequency Cap**: No limit
- **Conditions**: All confirmed orders

### 5. Care Guide Follow-up
- **Trigger**: 3 days after order delivery
- **Template**: care_guide (ID: ${this.templateIds.care_guide || 'TBD'})
- **Frequency Cap**: Once per month
- **Conditions**: Order value > $75, Premium/Luxury items

### 6. Review Request
- **Trigger**: 1 week after order delivery
- **Template**: review_request (ID: ${this.templateIds.review_request || 'TBD'})
- **Frequency Cap**: Once per 45 days
- **Conditions**: All delivered orders

### 7. Re-engagement - 30 Days Inactive
- **Trigger**: Contact added to "Re-engagement - Inactive Customers" list
- **Delay**: Immediate (triggered by backend logic)
- **Template**: reengagement (ID: ${this.templateIds.reengagement || 'TBD'})
- **Frequency Cap**: Once per 30 days
- **Conditions**: No purchases in 30 days, previous order count > 0

### 8. Re-engagement - 90 Days Inactive
- **Trigger**: 90 days since last purchase
- **Template**: reengagement (ID: ${this.templateIds.reengagement || 'TBD'})
- **Frequency Cap**: Once per 90 days
- **Conditions**: No purchases in 90 days, LTV > $100

## 🎯 Customer Segmentation Rules:

### Premium Customers:
- Total spent > $200 OR
- Order count > 3 OR  
- Quality score > 4.0

### Sustainability Focused:
- Purchased sustainable/eco-friendly items OR
- Clicked sustainability-related content

### High Value Cart:
- Current cart value > $150 OR
- Premium/Luxury items in cart

## 📊 Monitoring & Optimization:

### Key Metrics to Track:
- Open Rate Target: >25% (industry avg: 20-25%)
- Click Rate Target: >4% (industry avg: 2-3%)
- Unsubscribe Rate: <0.5% (industry avg: <2%)
- Cart Recovery Rate Target: >15% (industry avg: 10-15%)

### A/B Testing Recommendations:
1. **Subject Lines**: Test urgency vs benefit-focused
2. **Send Times**: Test 9 AM vs 2 PM vs 6 PM  
3. **Call-to-Actions**: Test "Shop Now" vs "Discover Quality"
4. **Personalization**: Test first name vs full name vs no name

### Daily Monitoring Checklist:
- [ ] Check daily send volume vs 300-email free tier limit
- [ ] Review bounce rates (<5% acceptable)
- [ ] Monitor spam complaints (<0.1% acceptable)
- [ ] Track conversion rates by automation workflow
- [ ] Update suppression list based on webhook events

## 🔧 Manual Configuration Steps in Brevo Dashboard:

1. **Go to Automation** → Create Workflow
2. **Set Trigger** based on guides above
3. **Add Conditions** for customer segmentation
4. **Select Template** using IDs provided above
5. **Configure Timing** with delays and frequency caps
6. **Test Workflow** with sample customer data
7. **Activate** after successful testing

---

**Next Steps:**
1. Log into Brevo dashboard: https://app.brevo.com/
2. Navigate to Automation → Workflows
3. Create each workflow using this guide
4. Test all automations with sample data
5. Monitor performance and optimize based on metrics

*Generated: ${new Date().toISOString()}*
`;
  }

  // Main deployment function
  async deploy() {
    console.log('🚀 Starting CalistaLife Brevo Marketing Automation Deployment...\n');

    try {
      await this.createContactLists();
      await this.createEmailTemplates();
      await this.configureWebhooks();
      
      const automationGuide = this.generateAutomationGuide();
      
      // Save automation guide
      const guidePath = path.join(__dirname, 'brevo-automation-guide.md');
      fs.writeFileSync(guidePath, automationGuide);
      
      this.log('✅ Deployment completed successfully!');
      this.log(`📋 Automation guide saved to: ${guidePath}`);
      
      // Save deployment log
      const logPath = path.join(__dirname, '../logs', `brevo-deployment-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(logPath, JSON.stringify(this.deploymentLog, null, 2));
      
      console.log('\n🎉 Brevo Marketing Automation Deployment Complete!');
      console.log(`📊 Template IDs:`, this.templateIds);
      console.log(`📋 List IDs:`, this.contactLists);
      console.log(`📝 Check automation guide: ${guidePath}`);
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Export for use in other scripts
module.exports = BrevoDeploymentManager;

// Run deployment if called directly
if (require.main === module) {
  const deployment = new BrevoDeploymentManager();
  deployment.deploy().catch(console.error);
}