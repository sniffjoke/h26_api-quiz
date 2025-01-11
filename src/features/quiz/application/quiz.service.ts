import { Injectable } from '@nestjs/common';
import { QuizRepositoryTO } from '../infrastructure/quiz.repository.to';
import { UsersService } from '../../users/application/users.service';
import { CreateAnswerInputModel } from '../api/models/input/create-answer.input.model';
import { CreateQuestionInputModel } from '../api/models/input/create-question.input.model';
import { UpdatePublishStatusInputModel } from '../api/models/input/update-publish-status.input.model';

@Injectable()
export class QuizService {

  constructor(
    private readonly quizRepository: QuizRepositoryTO,
    private readonly usersService: UsersService,
  ) {

  }

  async getCurrentUnfGame(bearerHeader: string) {
    const user = await this.usersService.getUserByAuthToken(bearerHeader);
    return await this.quizRepository.getGame(user);
  }

  async findGameById(id: number, bearerHeader: string) {
    const user = await this.usersService.getUserByAuthToken(bearerHeader);
    return await this.quizRepository.findGame(id, user);
  }

  async createOrConnect(bearerHeader: string): Promise<number> {
    const user = await this.usersService.getUserByAuthToken(bearerHeader);
    return await this.quizRepository.findOrCreateConnection(user);
  }

  //------------------------------------------------------------------------------------------//
  //--------------------------------------STATISTIC-------------------------------------------//
  //------------------------------------------------------------------------------------------//

  async getMyStatistics(bearerHeader: string) {
    const user = await this.usersService.getUserByAuthToken(bearerHeader);
    const myGames = await this.quizRepository.findGamesByUser(user);
    let sumScore = 0;
    let wins = 0;
    let loses = 0;
    let draws = 0;
    myGames.map(game => {
      if (game.firstPlayerProgress.userId === user.id) {
        sumScore = sumScore + game.firstPlayerProgress.score;
      } else if (game.secondPlayerProgress.userId === user.id) {
        sumScore = sumScore + game.secondPlayerProgress.score;
      }
      if (game.firstPlayerProgress.score === game.secondPlayerProgress.score) {
        draws += 1;
      }
      if (game.firstPlayerProgress.userId === user.id &&
        game.firstPlayerProgress.score > game.secondPlayerProgress.score) {
        wins += 1;
      } else if (game.firstPlayerProgress.userId === user.id &&
        game.firstPlayerProgress.score < game.secondPlayerProgress.score) {
        loses += 1;
      }
      if (game.secondPlayerProgress.userId === user.id &&
        game.secondPlayerProgress.score > game.firstPlayerProgress.score) {
        wins += 1;
      } else if (game.secondPlayerProgress.userId === user.id &&
        game.secondPlayerProgress.score < game.firstPlayerProgress.score) {
        loses += 1;
      }
    });
    const gamesCount = myGames.length;
    const avgScores = Number((sumScore/gamesCount).toFixed(2));
    // console.log(myGames);
    return {
      sumScore,
      avgScores,
      gamesCount,
      winsCount: wins,
      lossesCount: loses,
      drawsCount: draws,
    };
  }

  //------------------------------------------------------------------------------------------//
  //----------------------------------------QUESTIONS-----------------------------------------//
  //------------------------------------------------------------------------------------------//

  async sendAnswer(answerData: CreateAnswerInputModel, bearerHeader: string) {
    const user = await this.usersService.getUserByAuthToken(bearerHeader);
    return await this.quizRepository.sendAnswer(answerData.answer, user);
  }

  async createNewQuestion(questionData: CreateQuestionInputModel): Promise<string> {
    const newQuestionId = await this.quizRepository.createQuestion(questionData);
    return newQuestionId;
  }

  async updateQuestionById(id: string, questionData: Partial<CreateQuestionInputModel>) {
    return await this.quizRepository.updateQuestionById(id, questionData);
  }

  async deleteQuestion(id: string) {
    return await this.quizRepository.deleteQuestion(id);
  }

  async updateQuestionPublish(id: string, updateData: UpdatePublishStatusInputModel) {
    return await this.quizRepository.updateQuestionPublishStatus(id, updateData);
  }

}
