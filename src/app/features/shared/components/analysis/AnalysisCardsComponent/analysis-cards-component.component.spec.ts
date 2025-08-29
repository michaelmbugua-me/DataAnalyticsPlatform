import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AnalysisCardsComponentComponent} from './analysis-cards-component.component';

describe('AnalysisCardsComponentComponent', () => {

  let component: AnalysisCardsComponentComponent;
  let fixture: ComponentFixture<AnalysisCardsComponentComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [AnalysisCardsComponentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisCardsComponentComponent);
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
