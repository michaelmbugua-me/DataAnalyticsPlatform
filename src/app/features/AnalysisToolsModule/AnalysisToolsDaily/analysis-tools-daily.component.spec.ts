import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AnalysisToolsDailyComponent} from './analysis-tools-daily.component';

describe('AnalysisToolsDailyComponent', () => {

  let component: AnalysisToolsDailyComponent;
  let fixture: ComponentFixture<AnalysisToolsDailyComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [AnalysisToolsDailyComponent]
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
