import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PivotTableComponentComponent} from './pivot-table-component.component';

describe('PivotTableComponentComponent', () => {

  let component: PivotTableComponentComponent;
  let fixture: ComponentFixture<PivotTableComponentComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [PivotTableComponentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PivotTableComponentComponent);
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
