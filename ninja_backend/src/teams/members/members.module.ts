import { Module } from "@nestjs/common";

import { MembersController } from "./members.controller";

import { MembersService } from "./members.service";

import { MembersRepository } from "./members.repository";

@Module({
  controllers: [MembersController],

  providers: [MembersService, MembersRepository],

  exports: [MembersService],
})
export class MembersModule {}
