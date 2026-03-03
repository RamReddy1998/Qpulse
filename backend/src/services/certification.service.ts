import { CertificationRepository } from '../repositories/certification.repository';
import { NotFoundError } from '../utils/errors';

export class CertificationService {
  private certRepo: CertificationRepository;

  constructor() {
    this.certRepo = new CertificationRepository();
  }

  async getAll() {
    return this.certRepo.findAll();
  }

  async getById(id: string) {
    const cert = await this.certRepo.findById(id);
    if (!cert) {
      throw new NotFoundError('Certification not found');
    }
    return cert;
  }

  async getQuestionCounts() {
    return this.certRepo.getQuestionCountByCertification();
  }
}
