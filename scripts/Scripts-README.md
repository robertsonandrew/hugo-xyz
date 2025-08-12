# 📝 Quote Management System

> **Reliable quote fetching and management for Hugo Blowfish theme**  
> Static quote system that eliminates CORS issues and provides consistent, offline-capable quote delivery.

[![Node.js](https://img.shields.io/badge/Node.js-14+-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![API Ninjas](https://img.shields.io/badge/API-Ninjas-FF6B35)](https://api.api-ninjas.com/)
[![Static](https://img.shields.io/badge/Type-Static-green)](https://jamstack.org/)

## 🎯 Purpose

This script manages quotes for the Hugo site's dynamic quote banner by:
- Fetching fresh quotes from API Ninjas endpoints
- Normalizing different API formats into a consistent structure
- De-duplicating content to avoid repetition
- Writing static JSON data for offline reliability

## ⚡ Quick Usage

### Basic Update
```bash
# Fetch fresh quotes (requires API key)
API_NINJAS_KEY=your_key_here node scripts/update-quotes.js
```

### Custom Quantities
```bash
# Specify different amounts for each category
API_NINJAS_KEY=your_key ADVICE_LIMIT=30 DADJOKES_LIMIT=20 QUOTES_LIMIT=25 node scripts/update-quotes.js
```

### Dry Run (Testing)
```bash
# Test without writing to file
node scripts/update-quotes.js --dry-run
```

## 🔧 Configuration

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_NINJAS_KEY` | ✅ Yes | - | Your API Ninjas API key |
| `ADVICE_LIMIT` | ❌ Optional | `20` | Number of advice quotes to fetch |
| `DADJOKES_LIMIT` | ❌ Optional | `20` | Number of dad jokes to fetch |
| `QUOTES_LIMIT` | ❌ Optional | `20` | Number of wisdom quotes to fetch |

### Getting an API Key
1. Visit [API Ninjas](https://api.api-ninjas.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Use it in the environment variable

## 📊 Data Sources & Processing

### API Endpoints Used
| Endpoint | Category | Author Rule | Content Type |
|----------|----------|-------------|--------------|
| `/v1/advice` | `advice` | No author | Life advice |
| `/v1/dadjokes` | `dadjokes` | No author | Dad jokes |
| `/v1/quotes` | `quotes` | Show author | Wisdom quotes |

### Data Normalization
All quotes are normalized to this structure:
```json
{
  "text": "Quote content here",
  "author": "Author Name (or empty string)",
  "category": "advice|dadjokes|quotes"
}
```

### Author Display Rules
- **Advice & Dad Jokes**: No author shown (empty string)
- **Wisdom Quotes**: Author name displayed when available
- This prevents attribution of generic advice/jokes to famous people

## 🔄 Scheduling Updates

### Manual Updates
```bash
# Weekly refresh
API_NINJAS_KEY=your_key node scripts/update-quotes.js
```

### Automated Updates (Cron)
```bash
# Edit crontab
crontab -e

# Add weekly Monday 9 AM update
0 9 * * 1 cd /path/to/your/hugo/site && API_NINJAS_KEY=your_key node scripts/update-quotes.js
```

### Build Integration
```bash
# Add to your CI/CD pipeline
- name: Update quotes
  run: API_NINJAS_KEY=${{ secrets.API_NINJAS_KEY }} node scripts/update-quotes.js
```

## 📁 File Structure

```
your-hugo-site/
├── scripts/
│   ├── update-quotes.js         # This script
│   └── README.md               # This documentation
├── data/
│   └── quotes.json             # Generated quotes (DO NOT EDIT MANUALLY)
└── layouts/partials/
    └── quotes-banner.html      # Consumes the quotes data
```

## 🛠️ Customization

### Modify Fetch Limits
Edit the script to change default limits:
```javascript
const CONFIG = {
  ADVICE_LIMIT: parseInt(process.env.ADVICE_LIMIT) || 25,     // Increase default
  DADJOKES_LIMIT: parseInt(process.env.DADJOKES_LIMIT) || 15, // Decrease default  
  QUOTES_LIMIT: parseInt(process.env.QUOTES_LIMIT) || 30,     // Increase default
};
```

### Add New Quote Sources
To add additional API endpoints:
1. Add new fetch function in the script
2. Normalize data to the standard format
3. Add to the main processing pipeline
4. Update the Hugo configuration if needed

### Content Filtering
Add content filtering logic:
```javascript
// Filter out inappropriate content
const isAppropriate = (quote) => {
  const inappropriate = ['word1', 'word2'];
  return !inappropriate.some(word => 
    quote.text.toLowerCase().includes(word)
  );
};
```

## 🚀 Integration with Hugo

### Hugo Configuration
The generated `data/quotes.json` is automatically available in Hugo templates as `.Site.Data.quotes`.

### Template Usage
```go-html-template
{{ range .Site.Data.quotes }}
  <blockquote>
    <p>{{ .text }}</p>
    {{ if .author }}
      <cite>— {{ .author }}</cite>
    {{ end }}
  </blockquote>
{{ end }}
```

### Quote Banner Integration
The quotes are consumed by the dynamic quote banner system configured in `config/_default/params.toml`:

```toml
[quoteBanner]
  enabled = true
  refreshInterval = 2000  # Rotate every 2 seconds
  # ... other settings
```

## 🔍 Troubleshooting

### Common Issues

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| "API key required" | Missing or invalid API key | Check `API_NINJAS_KEY` environment variable |
| Rate limit errors | Too many API calls | Reduce fetch limits or wait before retrying |
| Empty quotes.json | API endpoints down | Check API Ninjas status page |
| Duplicate quotes | De-duplication failed | Review the duplicate detection logic |

### Debug Mode
```bash
# Enable verbose logging
DEBUG=true API_NINJAS_KEY=your_key node scripts/update-quotes.js
```

### Verify Output
```bash
# Check the generated file
cat data/quotes.json | jq '.[:5]'  # Show first 5 quotes formatted

# Count quotes by category
cat data/quotes.json | jq 'group_by(.category) | map({category: .[0].category, count: length})'
```

## 🔒 Security & Privacy

### API Key Security
- Never commit API keys to version control
- Use environment variables or secure CI/CD secrets
- Rotate API keys periodically
- Consider using separate keys for development/production

### Content Safety
- All content comes from API Ninjas curated sources
- No user-generated content is processed
- Static files eliminate runtime security risks
- No sensitive data is stored or transmitted

## 📈 Performance Impact

### Build Time
- Typically adds 2-5 seconds to build process
- Scales with number of quotes fetched
- Consider caching in CI/CD environments

### Runtime Impact
- **Zero runtime impact** - all data is static
- No API calls from user browsers
- Eliminates CORS and rate limiting issues
- Perfect for JAMstack architecture

## 🤝 Contributing

### Reporting Issues
- Check existing issues before creating new ones
- Include script output and error messages
- Specify Node.js version and operating system

### Feature Requests
- Propose new quote sources
- Suggest filtering improvements  
- Request integration enhancements

### Pull Requests
- Test thoroughly with different API limits
- Update documentation for new features
- Follow existing code style
- Add appropriate error handling

---

## 📜 License

This script is part of the Hugo theme project and follows the same MIT License terms.

---

<div align="center">

**Reliable quote management for modern Hugo sites**

[⬆ Back to Main README](../README.md)

</div>
