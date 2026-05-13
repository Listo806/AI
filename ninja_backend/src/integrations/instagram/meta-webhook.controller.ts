import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from "@nestjs/common";

@Controller("webhooks/meta")
export class MetaWebhookController {
  @Get()
  verify(
    @Query("hub.mode") mode: string,

    @Query("hub.verify_token")
    token: string,

    @Query("hub.challenge")
    challenge: string,
  ) {
    if (
      mode === "subscribe" &&
      token ===
        process.env
          .META_WEBHOOK_VERIFY_TOKEN
    ) {
      return challenge;
    }

    return "Invalid verify token";
  }

  @Post()
  async receive(@Body() body: any) {
    console.log(
      "META WEBHOOK:",
      JSON.stringify(body, null, 2),
    );

    return {
      received: true,
    };
  }
}