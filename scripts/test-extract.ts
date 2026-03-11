/**
 * Test script for the /api/extract endpoint.
 * Sends a sample query and prints the response beautifully.
 *
 * Usage: npx tsx scripts/test-extract.ts "Your test query here"
 */

const API_URL = 'http://localhost:5173/api/extract';

const SAMPLE_QUERY = `I've been thinking about starting my own business, but I'm worried about the financial risks. 
I have a stable job right now that pays well, but I feel unfulfilled. 
On one hand, entrepreneurship could give me the freedom and purpose I'm looking for. 
On the other hand, what if I fail and lose everything I've built up? 
My family depends on my income, so I can't just take reckless risks. 
But every day I stay in this job, I feel like I'm wasting my potential. 
Maybe I could start something on the side while keeping my job, but then I'd have no time for my family or myself. 
I keep going back and forth and can't make a decision.`;

async function testExtract(query: string): Promise<void> {
  console.log('═'.repeat(80));
  console.log('TESTING /api/extract ENDPOINT');
  console.log('═'.repeat(80));
  console.log('\n📤 SENDING QUERY:');
  console.log('─'.repeat(80));
  console.log(query);
  console.log('─'.repeat(80));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: query })
    });

    console.log(`\n📥 RESPONSE STATUS: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (data.error) {
      console.log('\n❌ ERROR:');
      console.log(data.error);
      return;
    }

    if (data.analysis) {
      printAnalysis(data.analysis);
    } else {
      console.log('\n⚠️  Unexpected response structure:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('\n❌ REQUEST FAILED:');
    console.log(error instanceof Error ? error.message : String(error));
    console.log('\n💡 Make sure the dev server is running: npm run dev');
  }
}

function printAnalysis(analysis: Record<string, unknown>): void {
  console.log('\n' + '═'.repeat(80));
  console.log('ANALYSIS RESULT');
  console.log('═'.repeat(80));

  // Summary
  if (analysis.summary) {
    console.log('\n📝 SUMMARY:');
    console.log('─'.repeat(80));
    console.log(analysis.summary);
  }

  // Quality
  if (analysis.extraction_quality) {
    console.log('\n📊 EXTRACTION QUALITY:', analysis.extraction_quality);
  }

  // Phrase Groups
  if (Array.isArray(analysis.phrase_groups) && analysis.phrase_groups.length > 0) {
    console.log('\n🔤 PHRASE GROUPS:', analysis.phrase_groups.length);
    console.log('─'.repeat(80));
    analysis.phrase_groups.forEach((phrase: Record<string, unknown>, i: number) => {
      console.log(`\n  ${i + 1}. [${phrase.type}] ${phrase.concept_label || 'N/A'}`);
      console.log(`     Text: "${phrase.text}"`);
      console.log(`     Span: ${phrase.start}-${phrase.end}`);
      console.log(`     Polarity: ${phrase.polarity}, Confidence: ${phrase.confidence || 'N/A'}`);
    });
  }

  // Statement Groups
  if (Array.isArray(analysis.statement_groups) && analysis.statement_groups.length > 0) {
    console.log('\n📋 STATEMENT GROUPS:', analysis.statement_groups.length);
    console.log('─'.repeat(80));
    analysis.statement_groups.forEach((stmt: Record<string, unknown>, i: number) => {
      console.log(`\n  ${i + 1}. [${stmt.role}]`);
      console.log(`     Text: "${stmt.text}"`);
      console.log(`     Span: ${stmt.start}-${stmt.end}`);
      if (Array.isArray(stmt.phrase_ids) && stmt.phrase_ids.length > 0) {
        console.log(`     Phrases: ${stmt.phrase_ids.join(', ')}`);
      }
    });
  }

  // Relations
  if (Array.isArray(analysis.relations) && analysis.relations.length > 0) {
    console.log('\n🔗 RELATIONS:', analysis.relations.length);
    console.log('─'.repeat(80));
    analysis.relations.forEach((rel: Record<string, unknown>, i: number) => {
      const source = rel.source as Record<string, string> | undefined;
      const target = rel.target as Record<string, string> | undefined;
      console.log(`\n  ${i + 1}. [${rel.type}]`);
      console.log(
        `     ${source?.kind || '?'}.${source?.id || '?'} → ${target?.kind || '?'}.${target?.id || '?'}`
      );
    });
  }

  // Issues
  if (Array.isArray(analysis.issues) && analysis.issues.length > 0) {
    console.log('\n⚠️  ISSUES:', analysis.issues.length);
    console.log('─'.repeat(80));
    analysis.issues.forEach((issue: Record<string, unknown>, i: number) => {
      console.log(`\n  ${i + 1}. [${issue.type}] ${issue.label}`);
      if (Array.isArray(issue.related_ids) && issue.related_ids.length > 0) {
        console.log(`     Related: ${issue.related_ids.join(', ')}`);
      }
    });
  }

  // Raw JSON (compact)
  console.log('\n' + '═'.repeat(80));
  console.log('RAW JSON (formatted):');
  console.log('═'.repeat(80));
  console.log(JSON.stringify(analysis, null, 2));
  console.log('\n' + '═'.repeat(80));
}

// Main
const query = process.argv[2] || SAMPLE_QUERY;
testExtract(query);
