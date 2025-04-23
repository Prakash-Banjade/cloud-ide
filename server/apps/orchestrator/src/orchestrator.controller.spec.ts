import { Test, TestingModule } from '@nestjs/testing';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';

describe('OrchestratorController', () => {
  let orchestratorController: OrchestratorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrchestratorController],
      providers: [OrchestratorService],
    }).compile();

    orchestratorController = app.get<OrchestratorController>(OrchestratorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(orchestratorController.getHello()).toBe('Hello World!');
    });
  });
});
