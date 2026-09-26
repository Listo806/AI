import { Module } from '@nestjs/common';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

// Public website contact form (/contact, /es/contact, /pt/contact).
// DatabaseService and ConfigService come from their @Global modules; the email
// goes out through the platform mailer (same SendGrid/SMTP sender config as
// every other transactional email).
@Module({
  imports: [PlatformMailModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
