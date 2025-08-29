import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AnalysisToolsDailyComponent} from './analysis-tools-daily.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AnalysisToolsDailyComponent', () => {

  let component: AnalysisToolsDailyComponent;
  let fixture: ComponentFixture<AnalysisToolsDailyComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [HttpClientTestingModule, AnalysisToolsDailyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisToolsDailyComponent);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
