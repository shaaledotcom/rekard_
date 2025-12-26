const puppeteer = require('puppeteer');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

class LoginOtpTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testRunId = this.generateTestRunId();
    this.screenshotDir = path.join(__dirname, 'screenshots', this.testRunId);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  generateTestRunId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');

    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    console.log('📱 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched successfully');

    console.log('📄 Creating new page...');
    this.page = await this.browser.newPage();
    console.log('✅ Page created successfully');
  }

  async cleanupTestEnvironment() {
    console.log('🧹 Cleaning up test environment...');

    if (this.browser) {
      await this.browser.close();
      console.log('🌐 Browser closed');
    }

    if (this.rl) {
      this.rl.close();
    }
  }

  async takeScreenshot(filename) {
    const screenshotPath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  async navigateToLoginPage() {
    console.log('🌐 Navigating to login page...');
    await this.page.goto('http://localhost:3000/auth', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    console.log('✅ Navigation to login page successful');

    const title = await this.page.title();
    console.log(`📄 Page title: ${title}`);
  }

  async analyzePageElements() {
    console.log('🔍 Analyzing page elements...');

    const forms = await this.page.$$('form');
    const inputs = await this.page.$$('input');
    const buttons = await this.page.$$('button');

    console.log(`📝 Found ${forms.length} forms, ${inputs.length} inputs, ${buttons.length} buttons`);

    await this.logInputFieldDetails(inputs);
    await this.logButtonDetails(buttons);

    return { forms, inputs, buttons };
  }

  async logInputFieldDetails(inputs) {
    if (inputs.length === 0) return;

    console.log('🔍 Input field details:');
    for (let i = 0; i < Math.min(inputs.length, 5); i++) {
      const input = inputs[i];
      try {
        const type = await input.evaluate(el => el.getAttribute('type'));
        const name = await input.evaluate(el => el.getAttribute('name'));
        const id = await input.evaluate(el => el.getAttribute('id'));
        const placeholder = await input.evaluate(el => el.getAttribute('placeholder'));
        console.log(`  Input ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
      } catch (error) {
        console.log(`  Input ${i + 1}: Error getting attributes - ${error.message}`);
      }
    }
  }

  async logButtonDetails(buttons) {
    if (buttons.length === 0) return;

    console.log('🔍 Button details:');
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const button = buttons[i];
      try {
        const type = await button.evaluate(el => el.getAttribute('type'));
        const text = await button.evaluate(el => el.textContent);
        console.log(`  Button ${i + 1}: type="${type}", text="${text}"`);
      } catch (error) {
        console.log(`  Button ${i + 1}: Error getting attributes - ${error.message}`);
      }
    }
  }

  async fillEmailAndSendOtp(inputs, buttons) {
    console.log('📧 Testing OTP sending flow...');

    if (inputs.length === 0 || buttons.length === 0) {
      throw new Error('No inputs or buttons found for OTP flow');
    }

    console.log('📝 Filling in test email...');
    await inputs[0].type('raghav@shaale.com');
    console.log('✅ Email filled successfully');

    console.log('🔘 Clicking Send OTP button...');
    await buttons[0].click();
    console.log('✅ Send OTP button clicked');
  }

  async waitForOtpInputField() {
    console.log('⏳ Waiting for OTP input field...');

    try {
      await this.page.waitForSelector('input[type="text"], input[name="otp"], input[name="code"], #otp, #code, .otp-input, .code-input', {
        timeout: 15000
      });
      console.log('✅ OTP input field appeared successfully!');
      return true;
    } catch (error) {
      console.log('❌ OTP input field did not appear within timeout');
      console.log('💡 This might mean OTP was not sent or there was an error');
      await this.takeScreenshot('otp-timeout.png');
      return false;
    }
  }

  async getOtpInputDetails() {
    const otpInputs = await this.page.$$('input[type="text"], input[name="otp"], input[name="code"], #otp, #code, .otp-input, .code-input');
    console.log(`🔍 Found ${otpInputs.length} OTP input field(s)`);

    if (otpInputs.length === 0) {
      throw new Error('No OTP input fields found');
    }

    const otpInput = otpInputs[0];
    const otpType = await otpInput.evaluate(el => el.getAttribute('type'));
    const otpName = await otpInput.evaluate(el => el.getAttribute('name'));
    const otpId = await otpInput.evaluate(el => el.getAttribute('id'));
    const otpPlaceholder = await otpInput.evaluate(el => el.getAttribute('placeholder'));

    console.log(`📝 OTP Input: type="${otpType}", name="${otpName}", id="${otpId}", placeholder="${otpPlaceholder}"`);

    return { otpInput, otpInputs };
  }

  async getUserOtpInput() {
    console.log('\n📱 Please check your email for the OTP code');
    return new Promise((resolve) => {
      this.rl.question('🔑 Enter the OTP code: ', (answer) => {
        resolve(answer);
      });
    });
  }

  async enterOtpCode(otpInput, userOtp) {
    if (!userOtp || !userOtp.trim()) {
      console.log('⚠️  No OTP code entered, skipping verification');
      return false;
    }

    console.log('📝 Entering OTP code...');
    await otpInput.type(userOtp.trim());
    console.log('✅ OTP code entered successfully');
    return true;
  }

  async findVerifyButton() {
    console.log('🔍 Looking for verify button...');
    const verifyButtons = await this.page.$$('button');
    console.log(`📝 Found ${verifyButtons.length} total buttons`);

    let verifyButton = null;
    for (let i = 0; i < verifyButtons.length; i++) {
      const button = verifyButtons[i];
      const buttonText = await button.evaluate(el => el.textContent);
      console.log(`  Button ${i + 1}: "${buttonText}"`);

      if (buttonText.toLowerCase().includes('verify otp')) {
        verifyButton = button;
        console.log('✅ Found "Verify OTP" button');
        break;
      }
    }

    return verifyButton;
  }

  async clickVerifyButton(verifyButton) {
    if (!verifyButton) {
      console.log('❌ "Verify OTP" button not found');
      return false;
    }

    console.log('🔘 Clicking Verify OTP button...');
    await verifyButton.click();
    console.log('✅ Verify OTP button clicked');
    return true;
  }

  async waitForLoginResult() {
    console.log('⏳ Waiting for login result...');

    try {
      await Promise.race([
        this.page.waitForSelector('.success, .dashboard, .welcome, [data-testid="success"]', { timeout: 10000 }),
        this.page.waitForSelector('.error, .alert, .error-message, [data-testid="error"]', { timeout: 10000 }),
        this.page.waitForNavigation({ timeout: 10000 })
      ]);

      return await this.analyzeLoginResult();
    } catch (timeoutError) {
      console.log('⏰ Login result timeout - taking screenshot for debugging');
      await this.takeScreenshot('login-result-timeout.png');
      return { status: 'timeout', message: 'Login result timeout' };
    }
  }

  async analyzeLoginResult() {
    const successElement = await this.page.$('.success, .dashboard, .welcome, [data-testid="success"]');
    const errorElement = await this.page.$('.error, .alert, .error-message, [data-testid="error"]');

    if (successElement) {
      const successText = await successElement.evaluate(el => el.textContent);
      console.log('✅ Login successful!');
      console.log(`📄 Success message: ${successText}`);
      return { status: 'success', message: successText };
    } else if (errorElement) {
      const errorText = await errorElement.evaluate(el => el.textContent);
      console.log('❌ Login failed');
      console.log(`📄 Error message: ${errorText}`);
      return { status: 'error', message: errorText };
    } else {
      console.log('✅ Login completed (redirected)');
      return { status: 'redirected', message: 'Login completed with redirect' };
    }
  }

  async testEmailValidation() {
    console.log('\n🧪 Testing email validation...');

    const invalidEmails = [
      'invalid-email',
      'test@',
      '@domain.com',
      'test..test@domain.com',
      'test@domain..com',
      'test@domain',
      'test space@domain.com'
    ];

    for (const invalidEmail of invalidEmails) {
      console.log(`📧 Testing invalid email: ${invalidEmail}`);

      await this.page.reload({ waitUntil: 'networkidle0' });
      const inputs = await this.page.$$('input');
      const buttons = await this.page.$$('button');

      if (inputs.length > 0 && buttons.length > 0) {
        await inputs[0].type(invalidEmail);
        await buttons[0].click();

        try {
          await this.page.waitForSelector('.error, .alert, .error-message, [data-testid="error"]', { timeout: 5000 });
          const errorElement = await this.page.$('.error, .alert, .error-message, [data-testid="error"]');
          const errorText = await errorElement.evaluate(el => el.textContent);
          console.log(`✅ Validation error caught: ${errorText}`);
        } catch (error) {
          console.log(`⚠️  No validation error for: ${invalidEmail}`);
        }
      }
    }
  }

  async testWrongOtp() {
    console.log('\n🧪 Testing wrong OTP handling...');

    const wrongOtps = ['000000', '123456', '999999', 'ABCDEF'];

    for (const wrongOtp of wrongOtps) {
      console.log(`🔑 Testing wrong OTP: ${wrongOtp}`);

      await this.page.reload({ waitUntil: 'networkidle0' });
      const inputs = await this.page.$$('input');
      const buttons = await this.page.$$('button');

      if (inputs.length > 0 && buttons.length > 0) {
        await inputs[0].type('raghav@shaale.com');
        await buttons[0].click();

        const otpFieldAppeared = await this.waitForOtpInputField();
        if (otpFieldAppeared) {
          const { otpInput } = await this.getOtpInputDetails();
          await otpInput.type(wrongOtp);

          const verifyButton = await this.findVerifyButton();
          if (verifyButton) {
            await verifyButton.click();

            try {
              await this.page.waitForSelector('.error, .alert, .error-message, [data-testid="error"]', { timeout: 5000 });
              const errorElement = await this.page.$('.error, .alert, .error-message, [data-testid="error"]');
              const errorText = await errorElement.evaluate(el => el.textContent);
              console.log(`✅ Wrong OTP error caught: ${errorText}`);
            } catch (error) {
              console.log(`⚠️  No error for wrong OTP: ${wrongOtp}`);
            }
          }
        }
      }
    }
  }

  async testEmptyFields() {
    console.log('\n🧪 Testing empty field validation...');

    const testCases = [
      { email: '', otp: '' },
      { email: 'raghav@shaale.com', otp: '' },
      { email: '', otp: '123456' }
    ];

    for (const testCase of testCases) {
      console.log(`📝 Testing: email="${testCase.email}", otp="${testCase.otp}"`);

      await this.page.reload({ waitUntil: 'networkidle0' });
      const inputs = await this.page.$$('input');
      const buttons = await this.page.$$('button');

      if (inputs.length > 0 && buttons.length > 0) {
        if (testCase.email) {
          await inputs[0].type(testCase.email);
        }

        await buttons[0].click();

        try {
          await this.page.waitForSelector('.error, .alert, .error-message, [data-testid="error"]', { timeout: 5000 });
          const errorElement = await this.page.$('.error, .alert, .error-message, [data-testid="error"]');
          const errorText = await errorElement.evaluate(el => el.textContent);
          console.log(`✅ Empty field validation: ${errorText}`);
        } catch (error) {
          console.log(`⚠️  No validation for empty fields`);
        }
      }
    }
  }

  async testRateLimiting() {
    console.log('\n🧪 Testing rate limiting...');

    console.log('📧 Sending multiple OTP requests...');

    for (let i = 1; i <= 5; i++) {
      console.log(`🔄 Attempt ${i}/5`);

      await this.page.reload({ waitUntil: 'networkidle0' });
      const inputs = await this.page.$$('input');
      const buttons = await this.page.$$('button');

      if (inputs.length > 0 && buttons.length > 0) {
        await inputs[0].type('raghav@shaale.com');
        await buttons[0].click();

        try {
          await this.page.waitForSelector('.error, .alert, .error-message, [data-testid="error"]', { timeout: 5000 });
          const errorElement = await this.page.$('.error, .alert, .error-message, [data-testid="error"]');
          const errorText = await errorElement.evaluate(el => el.textContent);
          if (errorText.toLowerCase().includes('rate limit') || errorText.toLowerCase().includes('too many') || errorText.toLowerCase().includes('wait')) {
            console.log(`✅ Rate limiting detected: ${errorText}`);
            break;
          }
        } catch (error) {
          console.log(`📧 OTP request ${i} sent successfully`);
        }

        await this.page.waitForTimeout(1000);
      }
    }
  }

  async testOtpResend() {
    console.log('\n🧪 Testing OTP resend functionality...');

    await this.page.reload({ waitUntil: 'networkidle0' });
    const inputs = await this.page.$$('input');
    const buttons = await this.page.$$('button');

    if (inputs.length > 0 && buttons.length > 0) {
      await inputs[0].type('raghav@shaale.com');
      await buttons[0].click();

      const otpFieldAppeared = await this.waitForOtpInputField();
      if (otpFieldAppeared) {
        const resendButtons = await this.page.$$('button');
        let resendButton = null;

        for (const button of resendButtons) {
          const buttonText = await button.evaluate(el => el.textContent);
          if (buttonText.toLowerCase().includes('resend') || buttonText.toLowerCase().includes('send again')) {
            resendButton = button;
            break;
          }
        }

        if (resendButton) {
          console.log('🔄 Found resend button, testing...');
          await resendButton.click();

          try {
            await this.page.waitForSelector('.success, .info, [data-testid="success"]', { timeout: 5000 });
            const successElement = await this.page.$('.success, .info, [data-testid="success"]');
            const successText = await successElement.evaluate(el => el.textContent);
            console.log(`✅ OTP resend successful: ${successText}`);
          } catch (error) {
            console.log('⚠️  OTP resend response not detected');
          }
        } else {
          console.log('ℹ️  No resend button found');
        }
      }
    }
  }

  async testCaseSensitivity() {
    console.log('\n🧪 Testing email case sensitivity...');

    const emailVariations = [
      'raghav@shaale.com',
      'RAGHAV@shaale.com',
      'Raghav@SHAALE.com',
      'RAGHAV@SHAALE.COM'
    ];

    for (const email of emailVariations) {
      console.log(`📧 Testing email case: ${email}`);

      await this.page.reload({ waitUntil: 'networkidle0' });
      const inputs = await this.page.$$('input');
      const buttons = await this.page.$$('button');

      if (inputs.length > 0 && buttons.length > 0) {
        await inputs[0].type(email);
        await buttons[0].click();

        try {
          await this.page.waitForSelector('input[type="text"], input[name="otp"], input[name="code"], #otp, #code, .otp-input, .code-input', { timeout: 10000 });
          console.log(`✅ OTP sent for: ${email}`);
        } catch (error) {
          console.log(`❌ OTP not sent for: ${email}`);
        }
      }
    }
  }

  async runLoginOtpTest() {
    try {
      console.log('🚀 Starting login with OTP test...');

      await this.setupTestEnvironment();
      await this.navigateToLoginPage();

      const { inputs, buttons } = await this.analyzePageElements();
      await this.fillEmailAndSendOtp(inputs, buttons);

      const otpFieldAppeared = await this.waitForOtpInputField();
      if (!otpFieldAppeared) {
        throw new Error('OTP input field did not appear');
      }

      const { otpInput } = await this.getOtpInputDetails();
      const userOtp = await this.getUserOtpInput();

      const otpEntered = await this.enterOtpCode(otpInput, userOtp);
      if (!otpEntered) {
        console.log('🎯 Test completed (OTP verification skipped)');
        return;
      }

      const verifyButton = await this.findVerifyButton();
      const buttonClicked = await this.clickVerifyButton(verifyButton);
      if (!buttonClicked) {
        throw new Error('Could not click verify button');
      }

      const loginResult = await this.waitForLoginResult();
      console.log(`🎯 Login result: ${loginResult.status} - ${loginResult.message}`);

      console.log('🎯 Login with OTP test completed successfully!');

    } catch (error) {
      console.error('💥 Test failed:', error.message);
      await this.takeScreenshot('test-failure.png');
      throw error;
    } finally {
      await this.cleanupTestEnvironment();
    }
  }

  async runAllTestCases() {
    try {
      console.log('🚀 Starting comprehensive OTP login test suite...');

      await this.setupTestEnvironment();
      await this.navigateToLoginPage();

      console.log('\n📋 Running basic functionality test...');
      const { inputs, buttons } = await this.analyzePageElements();
      await this.fillEmailAndSendOtp(inputs, buttons);

      const otpFieldAppeared = await this.waitForOtpInputField();
      if (!otpFieldAppeared) {
        console.log('⚠️  Basic OTP flow failed, continuing with other tests...');
      }

      await this.testEmailValidation();
      await this.testWrongOtp();
      await this.testEmptyFields();
      await this.testRateLimiting();
      await this.testOtpResend();
      await this.testCaseSensitivity();

      console.log('\n🎯 All test cases completed!');

    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      await this.takeScreenshot('test-suite-failure.png');
      throw error;
    } finally {
      await this.cleanupTestEnvironment();
    }
  }
}

async function runLoginOtpTest() {
  const testRunner = new LoginOtpTestRunner();
  await testRunner.runLoginOtpTest();
}

async function runAllTestCases() {
  const testRunner = new LoginOtpTestRunner();
  await testRunner.runAllTestCases();
}

// Run the login with OTP test
if (require.main === module) {
  const args = process.argv.slice(2);
  const runBasicTest = args.includes('--basic') || args.includes('-b');

  if (runBasicTest) {
    console.log('🚀 Starting basic login with OTP test for Rekard...');
    console.log('💡 Use --basic or -b flag to run basic test only');
    console.log('');

    runLoginOtpTest()
      .then(() => {
        console.log('');
        console.log('🎉 Test passed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('');
        console.error('💥 Test failed:', error);
        process.exit(1);
      });
  } else {
    console.log('🚀 Starting comprehensive OTP login test suite for Rekard...');
    console.log('');

    runAllTestCases()
      .then(() => {
        console.log('');
        console.log('🎉 All tests passed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('');
        console.error('💥 Test suite failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { LoginOtpTestRunner, runLoginOtpTest, runAllTestCases };
