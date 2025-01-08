import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, EmailConfirmationModel } from '../api/models/input/create-user.dto';
import { UserEntity } from '../domain/user.entity';
import { EmailConfirmationEntity } from '../domain/email-confirmation.entity';


@Injectable()
export class UsersRepositoryTO {
  constructor(
    @InjectRepository(UserEntity) private readonly uRepository: Repository<UserEntity>,
    @InjectRepository(EmailConfirmationEntity) private readonly eCRepository: Repository<EmailConfirmationEntity>,
  ) {
  }

  async createUser(userData: CreateUserDto, emailConfirmationDto: EmailConfirmationModel) {
    const user = new UserEntity();
    user.login = userData.login;
    user.email = userData.email;
    user.password = userData.password;
    const newUser = await this.uRepository.save(user);

    const emailConfirmation = new EmailConfirmationEntity();
    emailConfirmation.userId = newUser.id;
    emailConfirmation.confirmationCode = emailConfirmationDto.confirmationCode as string;
    emailConfirmation.expirationDate = emailConfirmationDto.expirationDate as string;
    emailConfirmation.isConfirm = emailConfirmationDto.isConfirm;

    await this.uRepository.manager.save(emailConfirmation);
    return newUser;
  }

  async findUserById(id: string) {
    const findedUser = await this.uRepository.findOne(
      { where: { id } },
    );
    if (!findedUser) {
      throw new NotFoundException('User not found');
    }
    return findedUser;
  }


  async updateUserByActivateEmail(userId: any) {
    // const findedUser = await this.uRepository.findOne({
    //   where: { id: userId },
    //   relations: ['emailConfirmation'],
    // });
    // if (findedUser && findedUser.emailConfirmation) {
    //   findedUser.emailConfirmation.isConfirm = true;
    //   await this.uRepository.manager.save(findedUser);
    //   return findedUser.emailConfirmation;
    // }
    // return null;
    const findedEmailInfo = await this.eCRepository.findOne({
      where: { userId },
    });
    if (findedEmailInfo) {
      findedEmailInfo.isConfirm = true;
      await this.eCRepository.manager.save(findedEmailInfo);
      return findedEmailInfo;
    }
    return null;
  }

  async updateUserByResendEmail(userId: string, emailConfirmation: EmailConfirmationModel) {
    // const findedUser = await this.uRepository.findOne({
    //   where: { id: userId },
    //   relations: ['emailConfirmation'],
    // });
    // if (findedUser && findedUser.emailConfirmation) {
    //   findedUser.emailConfirmation = { ...findedUser.emailConfirmation, ...emailConfirmation };
    //   await this.uRepository.manager.save(findedUser);
    //   return findedUser.emailConfirmation;
    // }
    // return null;
    const findedEmailInfo = await this.eCRepository.findOne({
      where: { userId },
    });
    if (findedEmailInfo) {
      findedEmailInfo.isConfirm = emailConfirmation.isConfirm;
      findedEmailInfo.confirmationCode = emailConfirmation.confirmationCode as string;
      findedEmailInfo.expirationDate = emailConfirmation.expirationDate as string;
      await this.eCRepository.manager.save(findedEmailInfo);
      return findedEmailInfo;
    }
    return null;
  }

  async findUserByIdOrNull(id: string) {
    const findedUser = await this.uRepository.findOne(
      { where: { id } },
    );
    if (!findedUser) {
      return null;
    } else return findedUser;
  }

  async findUserByLogin(login: string) {
    const findedUser = await this.uRepository.findOne(
      { where: { login } },
    );
    if (!findedUser) {
      throw new UnauthorizedException('User not found');
    }
    return findedUser;
  }

  async findUserByEmail(email: string) {
    const findedUser = await this.uRepository.findOne({
        where: { email },
      },
    );
    if (!findedUser) {
      throw new BadRequestException('Email not exists');
    }
    return findedUser;
  }

  async findUserByCode(code: string) {
    // const findedUsers = await this.uRepository.find({
    //     relations: ['emailConfirmation'],
    //   },
    // );
    // const findedUser = findedUsers.find((user) => user.emailConfirmation.confirmationCode === code);
    // if (!findedUser) {
    //   throw new BadRequestException('Code not found');
    // }
    // return findedUser;
    const findEmailInfo = await this.eCRepository.findOne({
      where: { confirmationCode: code },
    })
    if (!findEmailInfo) {
        throw new BadRequestException('Code not found');
    }
    return findEmailInfo;
  }

  async deleteUserById(id: string) {
    const findedUser = await this.findUserById(id);
    return await this.uRepository.delete(
      { id },
    );
  }

  async checkIsUserExists(login: string, email: string) {
    const findedUserByLogin = await this.uRepository.findOne(
      { where: { login } },
    );
    if (findedUserByLogin) {
      throw new BadRequestException(
        'Login already exists',
      );
    }
    const findedUserByEmail = await this.uRepository.findOne(
      { where: { email } },
    );
    if (findedUserByEmail) {
      throw new BadRequestException('Email already exists');
    }
  }

  async findEmailInfoByUserId(userId: string) {
    const findedEmailInfo = await this.eCRepository.findOne({
      where: { userId },
    });
    if (!findedEmailInfo) {
      throw new BadRequestException('User profile not found')
    }
    return findedEmailInfo;
  }

}
