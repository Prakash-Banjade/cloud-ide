import { Test, TestingModule } from '@nestjs/testing';
import { RunnerController } from './runner.controller';
import { RunnerService } from './runner.service';

describe('RunnerController', () => {
  let runnerController: RunnerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RunnerController],
      providers: [RunnerService],
    }).compile();

    runnerController = app.get<RunnerController>(RunnerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(runnerController.getHello()).toBe('Hello World!');
    });
  });
});
