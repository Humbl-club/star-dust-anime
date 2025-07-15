import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const ConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome! Please confirm your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🎌 Welcome to AniTracker!</Heading>
        </Section>
        
        <Section style={content}>
          <Text style={text}>
            Hi there! Welcome to AniTracker, your ultimate anime and manga tracking companion.
          </Text>
          
          <Text style={text}>
            To get started with discovering amazing anime, tracking your progress, and connecting with fellow fans, please confirm your email address by clicking the button below:
          </Text>
          
          <Section style={buttonContainer}>
            <Button
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${encodeURIComponent(redirect_to)}`}
              style={button}
            >
              Confirm Email Address
            </Button>
          </Section>
          
          <Text style={smallText}>
            Or copy and paste this link in your browser:
          </Text>
          <Text style={linkText}>
            {`${supabase_url}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${encodeURIComponent(redirect_to)}`}
          </Text>
          
          <Text style={smallText}>
            If you didn't create an account with AniTracker, you can safely ignore this email.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            Happy tracking! 📚✨<br />
            The AniTracker Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#0f0f23',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const content = {
  backgroundColor: '#1a1a2e',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '32px',
  margin: '0 20px',
}

const text = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const smallText = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0 8px',
}

const linkText = {
  color: '#6366f1',
  fontSize: '12px',
  lineHeight: '16px',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
}

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
}

export default ConfirmationEmail