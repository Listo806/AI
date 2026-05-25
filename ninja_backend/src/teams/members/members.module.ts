import { Module, forwardRef  } from '@nestjs/common';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MembersRepository } from './members.repository';

import { TeamsModule } from '../teams.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    forwardRef(() => TeamsModule),
    UsersModule,
  ],

  controllers: [MembersController],

  providers: [
    MembersService,
    MembersRepository,
  ],

  exports: [MembersService],
})
export class MembersModule {}