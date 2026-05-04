
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

// Password generator with entropy calculation
class PasswordGenerator {
  constructor() {
    this.lowercase = "abcdefghijklmnopqrstuvwxyz";
    this.uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.numbers = "0123456789";
    this.symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  }

  calculateEntropy(length, charsetSize) {
    // Entropy in bits = log2(charset^length)
    return Math.log2(Math.pow(charsetSize, length));
  }

  getCharset(options) {
    let charset = "";
    if (options.lowercase) charset += this.lowercase;
    if (options.uppercase) charset += this.uppercase;
    if (options.numbers) charset += this.numbers;
    if (options.symbols) charset += this.symbols;
    return charset;
  }

  generatePassword(length, options) {
    const charset = this.getCharset(options);
    let password = "";

    // Ensure at least one character from each required type
    if (options.uppercase) {
      password += this.uppercase[
        Math.floor(Math.random() * this.uppercase.length)
      ];
    }
    if (options.numbers) {
      password += this.numbers[Math.floor(Math.random() * this.numbers.length)];
    }
    if (options.symbols) {
      password += this.symbols[Math.floor(Math.random() * this.symbols.length)];
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    return password;
  }

  assessPasswordStrength(password) {
    let charsetSize = 0;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    if (hasLowercase) charsetSize += 26;
    if (hasUppercase) charsetSize += 26;
    if (hasNumbers) charsetSize += 10;
    if (hasSymbols) charsetSize += 28;

    const entropy = this.calculateEntropy(password.length, charsetSize);

    let strength = "Weak";
    if (entropy >= 80) strength = "Very Strong";
    else if (entropy >= 60) strength = "Strong";
    else if (entropy >= 40) strength = "Moderate";

    return {
      password,
      length: password.length,
      entropy: entropy.toFixed(2),
      strength,
      charset_size: charsetSize,
      has_lowercase: hasLowercase,
      has_uppercase: hasUppercase,
      has_numbers: hasNumbers,
      has_symbols: hasSymbols,
    };
  }
}

async function askClaudeForPasswordAdvice(passwordInfo) {
  const conversationHistory = [];

  conversationHistory.push({
    role: "user",
    content: `I generated a password with the following characteristics:
- Length: ${passwordInfo.length}
- Entropy: ${passwordInfo.entropy} bits
- Strength: ${passwordInfo.strength}
- Character types: lowercase=${passwordInfo.has_lowercase}, uppercase=${passwordInfo.has_uppercase}, numbers=${passwordInfo.has_numbers}, symbols=${passwordInfo.has_symbols}

Please provide brief security advice for using this password, including any recommendations for improvement. Keep your response concise and practical.`,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: conversationHistory,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";
  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  conversationHistory.push({
    role: "user",
    content:
      "Based on your advice, what are the top 3 practices for password management?",
  });

  const followUpResponse = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: conversationHistory,
  });

  const followUpMessage =
    followUpResponse.content[0].type === "text"
      ? followUpResponse.content[0].text
      : "";

  return {
    advice: assistantMessage,
    practices: followUpMessage,
  };
}

async function demonstratePasswordGeneration() {
  const generator = new PasswordGenerator();

  console.log("🔐 Secure Password Generator with Entropy Analysis\n");
  console.log("=".repeat(50));

  // Generate passwords with different configurations
  const configurations = [
    {
      length: 12,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: false,
      name: "Standard (no symbols)",
    },
    {
      length: 16,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
      name: "Maximum Security",
    },
    {
      length: 20,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
      name: "Ultra Secure",
    },
  ];

  for (const config of configurations) {